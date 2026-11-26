import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, BookOpen, Check, Crown, GraduationCap, LogOut, Plus, Radio, RefreshCw, Trophy, Users, X, Zap } from 'lucide-react'
import { supabase } from './lib/supabase'

const emptyQuestion = () => ({ prompt: '', options: ['', '', '', ''], correct_index: 0, seconds: 20 })
const errText = (error) => error?.message?.replace('Failed to fetch', 'Bağlantı kurulamadı. İnternetini kontrol et.') || 'Bir hata oluştu.'
const medal = ['🥇', '🥈', '🥉']

export default function App() {
  const [session, setSession] = useState(null)
  const [page, setPage] = useState('home')
  const [authMode, setAuthMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [quizzes, setQuizzes] = useState([])
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Genel kültür')
  const [questions, setQuestions] = useState([emptyQuestion()])
  const [pin, setPin] = useState('')
  const [nickname, setNickname] = useState('')
  const [room, setRoom] = useState(null)
  const [participant, setParticipant] = useState(null)
  const [snapshot, setSnapshot] = useState(null)
  const [players, setPlayers] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [selected, setSelected] = useState(null)
  const [answerFeedback, setAnswerFeedback] = useState(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const roomChannel = useRef(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => listener.subscription.unsubscribe()
  }, [])

  const loadQuizzes = async () => {
    if (!session?.user) return
    const { data, error } = await supabase.from('quizzes').select('id,title,category,created_at').order('created_at', { ascending: false })
    if (error) setNotice(errText(error)); else setQuizzes(data || [])
  }
  useEffect(() => { loadQuizzes() }, [session?.user?.id])

  const loadTeacherRoom = async (roomId) => {
    const [snap, roster] = await Promise.all([
      supabase.rpc('get_room_snapshot', { p_room_id: roomId, p_participant_id: null, p_session_token: null }),
      supabase.from('room_participants').select('id,nickname,score,joined_at').eq('room_id', roomId).order('joined_at')
    ])
    if (snap.error) setNotice(errText(snap.error)); else setSnapshot(snap.data)
    if (roster.error) setNotice(errText(roster.error)); else setPlayers(roster.data || [])
    const { data: board } = await supabase.rpc('get_leaderboard', { p_room_id: roomId, p_participant_id: null, p_session_token: null })
    if (board) setLeaderboard(board)
  }

  const loadStudentRoom = async (r = room, p = participant) => {
    if (!r || !p) return
    const { data, error } = await supabase.rpc('get_room_snapshot', { p_room_id: r.id, p_participant_id: p.participant_id, p_session_token: p.session_token })
    if (error) { setNotice(errText(error)); return }
    setSnapshot(data)
    const { data: board, error: boardError } = await supabase.rpc('get_leaderboard', { p_room_id: r.id, p_participant_id: p.participant_id, p_session_token: p.session_token })
    if (!boardError && board) setLeaderboard(board)
    if (data.status !== 'active') setAnswerFeedback(null)
  }

  useEffect(() => {
    if (!room?.id) return
    const channel = supabase.channel('quizup-room-' + room.id)
      .on('broadcast', { event: 'sync' }, () => {
        if (participant) loadStudentRoom(room, participant)
        else loadTeacherRoom(room.id)
      }).subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          roomChannel.current = channel
          channel.send({ type: 'broadcast', event: 'sync', payload: { kind: 'connected' } })
        }
      })
    return () => { roomChannel.current = null; supabase.removeChannel(channel) }
  }, [room?.id, participant?.participant_id])

  useEffect(() => {
    setSelected(null)
    setAnswerFeedback(null)
  }, [snapshot?.current_question])

  const broadcast = async () => {
    if (!room?.id || !roomChannel.current) return
    await roomChannel.current.send({ type: 'broadcast', event: 'sync', payload: { at: Date.now() } })
  }

  const signIn = async (event) => {
    event.preventDefault(); setBusy(true); setNotice('')
    const fn = authMode === 'signup' ? supabase.auth.signUp : supabase.auth.signInWithPassword
    const { data, error } = await fn({ email: email.trim(), password })
    setBusy(false)
    if (error) return setNotice(errText(error))
    if (authMode === 'signup' && !data.session) setNotice('Hesap oluşturuldu. E-postana gelen doğrulama bağlantısına tıkla, sonra giriş yap.')
    else { setSession(data.session); setPage('teacher') }
  }

  const saveQuiz = async (event) => {
    event.preventDefault()
    if (!title.trim() || questions.some(q => !q.prompt.trim() || q.options.some(o => !o.trim()))) return setNotice('Yarışma adını, tüm soruları ve dört seçeneği doldur.')
    setBusy(true); setNotice('')
    const { data: quiz, error } = await supabase.from('quizzes').insert({ owner_id: session.user.id, title: title.trim(), category }).select().single()
    if (!error) {
      const rows = questions.map((q, position) => ({ quiz_id: quiz.id, position, prompt: q.prompt.trim(), options: q.options, correct_index: q.correct_index, seconds: q.seconds }))
      const inserted = await supabase.from('quiz_questions').insert(rows)
      if (inserted.error) {
        await supabase.from('quizzes').delete().eq('id', quiz.id)
        setNotice(errText(inserted.error))
      } else {
        setTitle(''); setQuestions([emptyQuestion()]); await loadQuizzes(); setPage('teacher'); setNotice('Yarışman kaydedildi. Şimdi PIN odası oluşturabilirsin.')
      }
    } else setNotice(errText(error))
    setBusy(false)
  }

  const createRoom = async (quizId) => {
    setBusy(true); setNotice('')
    const { data, error } = await supabase.rpc('create_room', { p_quiz_id: quizId })
    setBusy(false)
    if (error) return setNotice(errText(error))
    const nextRoom = { id: data.id, pin: data.pin }
    setRoom(nextRoom); setParticipant(null); setPage('host'); await loadTeacherRoom(data.id)
  }

  const joinRoom = async (event) => {
    event.preventDefault(); setBusy(true); setNotice('')
    const { data, error } = await supabase.rpc('join_room', { p_pin: pin, p_nickname: nickname.trim() })
    setBusy(false)
    if (error) return setNotice(errText(error))
    const nextRoom = { id: data.room_id, pin }
    const nextParticipant = { participant_id: data.participant_id, session_token: data.session_token, nickname: data.nickname }
    sessionStorage.setItem('quizup-participant', JSON.stringify({ room: nextRoom, participant: nextParticipant }))
    setRoom(nextRoom); setParticipant(nextParticipant); setAnswerFeedback(null); setPage('student'); await loadStudentRoom(nextRoom, nextParticipant)
  }

  const startRoom = async () => {
    setBusy(true)
    const { error } = await supabase.rpc('start_room', { p_room_id: room.id })
    setBusy(false)
    if (error) return setNotice(errText(error))
    await loadTeacherRoom(room.id); await broadcast()
  }

  const nextQuestion = async () => {
    setBusy(true)
    const { error } = await supabase.rpc('advance_room', { p_room_id: room.id })
    setBusy(false)
    if (error) return setNotice(errText(error))
    await loadTeacherRoom(room.id); await broadcast()
  }

  const submitAnswer = async (index) => {
    if (selected !== null || answerFeedback || !snapshot?.question) return
    setSelected(index); setBusy(true)
    const { data, error } = await supabase.rpc('submit_answer', {
      p_room_id: room.id, p_participant_id: participant.participant_id, p_session_token: participant.session_token,
      p_question_index: snapshot.current_question, p_selected_index: index
    })
    setBusy(false)
    if (error) { setSelected(null); return setNotice(errText(error)) }
    setAnswerFeedback(data); await loadStudentRoom()
    await supabase.channel('quizup-room-' + room.id).send({ type: 'broadcast', event: 'sync', payload: { kind: 'answer' } })
  }

  const signOut = async () => { await supabase.auth.signOut(); setSession(null); setPage('home'); setRoom(null); setSnapshot(null) }
  const addQuestion = () => setQuestions(q => [...q, emptyQuestion()])
  const updateQuestion = (index, key, value) => setQuestions(old => old.map((q, i) => i === index ? { ...q, [key]: value } : q))
  const updateOption = (qi, oi, value) => setQuestions(old => old.map((q, i) => i === qi ? { ...q, options: q.options.map((o, j) => j === oi ? value : o) } : q))
  const topThree = leaderboard.slice(0, 3)
  const pageTitle = useMemo(() => ({ home: 'QuizUp', teacher: 'Öğretmen paneli', create: 'Yarışma oluştur', join: 'PIN ile katıl', host: 'Canlı sınıf', student: 'Yarışma' }[page] || 'QuizUp'), [page])

  return <div className="qu-app">
    <header className="qu-header">
      <button className="qu-brand" onClick={() => setPage(session ? 'teacher' : 'home')}><span><Zap size={19} fill="currentColor"/></span>quiz<span>up</span><i>.</i></button>
      <div className="qu-header-right">
        <button className="qu-quiet" onClick={() => setPage('join')}>PIN ile katıl</button>
        {session ? <><button className="qu-quiet" onClick={() => setPage('teacher')}>Panelim</button><button className="qu-icon" onClick={signOut} title="Çıkış yap"><LogOut size={17}/></button></> : <button className="qu-primary qu-small" onClick={() => setPage('auth')}>Öğretmen girişi</button>}
      </div>
    </header>
    <main className="qu-main">
      {page === 'home' && <section className="qu-hero">
        <div><span className="qu-eyebrow"><GraduationCap size={16}/> ÖĞRETMENLER VE ÖĞRENCİLER İÇİN</span><h1>Dersi yarışmaya<br/><em>dönüştür.</em></h1><p>Öğretmen yarışmayı oluşturur, sınıf PIN ile katılır. Herkes aynı soruyu aynı anda görür; hız ve doğruluk puan kazandırır.</p><div className="qu-actions"><button className="qu-primary" onClick={() => setPage('auth')}>Öğretmen olarak başla <ArrowRight size={17}/></button><button className="qu-secondary" onClick={() => setPage('join')}>PIN ile katıl</button></div></div>
        <div className="qu-hero-card"><div className="qu-live"><span/> CANLI SINIF SİSTEMİ</div><div className="qu-hero-trophy"><Trophy size={54}/></div><h2>Bilgi. Hız. Zirve.</h2><p>Gerçek sınıf sıralaması</p><div className="qu-mini-podium"><b>🥈 2.</b><strong>👑 1.</strong><b>🥉 3.</b></div></div>
      </section>}
      {page === 'auth' && <section className="qu-center"><form className="qu-panel qu-auth" onSubmit={signIn}><span className="qu-eyebrow"><GraduationCap size={16}/> ÖĞRETMEN HESABI</span><h1>{authMode === 'login' ? 'Tekrar hoş geldin!' : 'Öğretmen hesabı oluştur'}</h1><p>Yarışmaların ve sınıfların sana özel saklanır.</p><label>E-posta<input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="ornek@okul.com"/></label><label>Şifre<input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="En az 6 karakter"/></label><button className="qu-primary qu-full" disabled={busy}>{busy ? 'Bekle...' : authMode === 'login' ? 'Giriş yap' : 'Hesap oluştur'} <ArrowRight size={17}/></button><button type="button" className="qu-text-btn" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}>{authMode === 'login' ? 'İlk kez mi geliyorsun? Hesap oluştur' : 'Zaten hesabın var mı? Giriş yap'}</button></form></section>}
      {page === 'teacher' && <section className="qu-section"><div className="qu-heading"><div><span className="qu-eyebrow">ÖĞRETMEN ALANI</span><h1>Yarışmaların</h1><p>Yarışmanı seç, sınıfına özel PIN oluştur.</p></div><button className="qu-primary" onClick={() => setPage('create')}><Plus size={17}/> Yarışma oluştur</button></div>{quizzes.length ? <div className="qu-quiz-grid">{quizzes.map(q => <article className="qu-quiz-card" key={q.id}><span className="qu-card-icon"><BookOpen size={23}/></span><small>{q.category}</small><h3>{q.title}</h3><button className="qu-primary qu-full" disabled={busy} onClick={() => createRoom(q.id)}><Radio size={16}/> PIN odası oluştur</button></article>)}</div> : <div className="qu-empty"><BookOpen size={34}/><h3>Henüz yarışman yok</h3><p>İlk yarışmanı oluştur; öğrencilerin PIN ile katılsın.</p><button className="qu-primary" onClick={() => setPage('create')}>İlk yarışmanı oluştur</button></div>}</section>}
      {page === 'create' && <section className="qu-section"><button className="qu-back" onClick={() => setPage('teacher')}>← Öğretmen paneli</button><div className="qu-heading"><div><span className="qu-eyebrow">YARIŞMA STÜDYOSU</span><h1>Yeni yarışma</h1><p>Sorularını ekle ve sınıfına hazırla.</p></div></div><form className="qu-create-layout" onSubmit={saveQuiz}><div className="qu-form-col"><div className="qu-panel"><label>Yarışma adı<input required maxLength={100} value={title} onChange={e => setTitle(e.target.value)} placeholder="Örn. 7. sınıf fen bilimleri"/></label><label>Kategori<select value={category} onChange={e => setCategory(e.target.value)}>{['Genel kültür','Bilim','Tarih','Coğrafya','Matematik','Teknoloji','Oyunlar','Spor','Eğlence','Doğa','Dil ve edebiyat'].map(c => <option key={c}>{c}</option>)}</select></label></div>{questions.map((q, qi) => <div className="qu-panel" key={qi}><div className="qu-question-head"><b>{qi + 1}. Soru</b><button type="button" className="qu-icon" disabled={questions.length === 1} onClick={() => setQuestions(old => old.filter((_, i) => i !== qi))}><X size={17}/></button></div><label>Soru metni<textarea required value={q.prompt} onChange={e => updateQuestion(qi, 'prompt', e.target.value)} placeholder="Sorunu yaz..."/></label><div className="qu-options">{q.options.map((o, oi) => <label className="qu-option" key={oi}><span>{String.fromCharCode(65 + oi)}</span><input required value={o} onChange={e => updateOption(qi, oi, e.target.value)} placeholder={'Seçenek ' + (oi + 1)}/><button type="button" className={q.correct_index === oi ? 'qu-correct selected' : 'qu-correct'} onClick={() => updateQuestion(qi, 'correct_index', oi)} title="Doğru cevap">{q.correct_index === oi ? <Check size={15}/> : null}</button></label>)}</div><label className="qu-inline-label">Soru süresi<select value={q.seconds} onChange={e => updateQuestion(qi, 'seconds', Number(e.target.value))}>{[10,15,20,30,45,60,90].map(s => <option key={s} value={s}>{s} saniye</option>)}</select></label></div>)}<button type="button" className="qu-add" onClick={addQuestion}><Plus size={17}/> Soru ekle</button></div><aside className="qu-panel qu-save"><h3>Yarışman hazır mı?</h3><p>{questions.length} soru eklendi. Doğru cevapları yeşil işaretle.</p><button className="qu-primary qu-full" disabled={busy}>{busy ? 'Kaydediliyor...' : 'Yarışmayı kaydet'} <ArrowRight size={17}/></button></aside></form></section>}
      {page === 'join' && <section className="qu-center"><form className="qu-panel qu-auth" onSubmit={joinRoom}><span className="qu-eyebrow"><Users size={16}/> ÖĞRENCİ GİRİŞİ</span><h1>PIN kodunu gir!</h1><p>Öğretmeninin paylaştığı 6 haneli kodla sınıfa katıl.</p><label>6 haneli PIN<input required inputMode="numeric" maxLength={6} value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000"/></label><label>Takma ad<input required maxLength={24} value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Sınıfta görünecek adın"/></label><button className="qu-primary qu-full" disabled={busy || pin.length !== 6}>{busy ? 'Katılınıyor...' : 'Sınıfa katıl'} <ArrowRight size={17}/></button></form></section>}
      {page === 'host' && room && <section className="qu-section"><div className="qu-heading"><div><span className="qu-eyebrow"><Radio size={15}/> ÖĞRETMEN KONTROLÜ</span><h1>Canlı sınıfın</h1><p>Öğrenciler bu PIN ile katılır.</p></div><span className="qu-status">{snapshot?.status === 'active' ? '● CANLI' : snapshot?.status === 'finished' ? 'TAMAMLANDI' : 'KATILIM BEKLENİYOR'}</span></div><div className="qu-live-layout"><div className="qu-panel qu-room-main"><div className="qu-pin-label">SINIF PIN KODU</div><div className="qu-big-pin">{room.pin}</div><p className="qu-muted">PIN'i öğrencilerinle paylaş.</p>{snapshot?.status === 'waiting' && <><h2>Katılan öğrenciler</h2><div className="qu-roster">{players.map(p => <span key={p.id}><Users size={15}/>{p.nickname}</span>)}{!players.length && <small>Henüz kimse katılmadı...</small>}</div><button className="qu-primary qu-full" disabled={!players.length || busy} onClick={startRoom}>Yarışmayı başlat <ArrowRight size={17}/></button></>}{snapshot?.status === 'active' && <><div className="qu-question-live"><small>SORU {snapshot.current_question + 1} / {snapshot.question?.total}</small><h2>{snapshot.question?.prompt}</h2><div className="qu-live-options">{snapshot.question?.options?.map((o,i) => <div key={i}>{String.fromCharCode(65+i)} · {o}</div>)}</div></div><button className="qu-primary qu-full" onClick={nextQuestion}>{snapshot.current_question + 1 >= snapshot.question?.total ? 'Yarışmayı bitir' : 'Sonraki soruya geç'} <ArrowRight size={17}/></button></>}{snapshot?.status === 'finished' && <div className="qu-finished"><Trophy size={35}/><h2>Yarışma tamamlandı!</h2><p>İşte sınıfının gerçek sıralaması.</p></div>}</div><Leaderboard rows={leaderboard}/></div></section>}
      {page === 'student' && room && participant && <section className="qu-section"><div className="qu-heading"><div><span className="qu-eyebrow">SINIF PIN · {room.pin}</span><h1>Merhaba, {participant.nickname}!</h1><p>{snapshot?.title || 'Öğretmeninin yarışması'}</p></div><span className="qu-status">{snapshot?.status === 'active' ? '● CANLI' : snapshot?.status === 'finished' ? 'TAMAMLANDI' : 'ÖĞRETMEN BEKLENİYOR'}</span></div>{snapshot?.status === 'waiting' && <div className="qu-panel qu-wait"><div className="qu-wait-icon">🎮</div><h2>Hazır ol!</h2><p>Öğretmenin yarışmayı başlattığında ilk soru burada görünecek.</p><div className="qu-wait-pin">{room.pin}</div></div>}{snapshot?.status === 'active' && <div className="qu-student-layout"><div className="qu-panel qu-student-question"><div className="qu-question-progress">SORU {snapshot.current_question + 1} / {snapshot.question?.total}</div><h2>{snapshot.question?.prompt}</h2><div className="qu-student-options">{snapshot.question?.options?.map((o,i) => <button key={i} disabled={selected !== null || !!answerFeedback || busy} className={selected === i ? 'chosen' : ''} onClick={() => submitAnswer(i)}><b>{String.fromCharCode(65+i)}</b>{o}</button>)}</div>{answerFeedback && <div className={answerFeedback.correct ? 'qu-feedback good' : 'qu-feedback bad'}>{answerFeedback.correct ? '✓ Doğru cevap!' : 'Bu kez olmadı.'} <b>+{answerFeedback.points} puan</b><small>Öğretmenin sonraki soruya geçmesini bekle.</small></div>}</div><Leaderboard rows={leaderboard}/></div>}{snapshot?.status === 'finished' && <div className="qu-panel qu-student-finish"><Trophy size={42}/><h2>Yarışma bitti!</h2><p>Toplam puanın: {leaderboard.find(x => x.nickname === participant.nickname)?.score || 0}</p><Leaderboard rows={leaderboard}/></div>}</section>}
    </main>
    {notice && <div className="qu-toast" role="status">{notice}<button onClick={() => setNotice('')}><X size={16}/></button></div>}
    <footer className="qu-footer"><b>quizup.</b><span>{pageTitle} · Öğretmen oluşturur, sınıf birlikte yarışır.</span></footer>
  </div>
}

function Leaderboard({ rows = [] }) {
  return <aside className="qu-panel qu-leaderboard"><div className="qu-board-title"><Trophy size={19}/><h3>Sınıf sıralaması</h3></div>{rows.length ? <><div className="qu-top-three">{rows.slice(0,3).map((r,i) => <div className={'qu-podium p' + i} key={r.nickname}><span>{medal[i]}</span><b>{r.nickname}</b><strong>{r.score}</strong><small>{i + 1}. sıra</small></div>)}</div><ol>{rows.map((r,i) => <li key={r.nickname}><span>{i+1}</span><b>{r.nickname}</b><strong>{r.score.toLocaleString('tr-TR')} puan</strong></li>)}</ol></> : <div className="qu-board-empty"><Users size={23}/><p>Öğrenciler katıldıkça sıralama burada oluşacak.</p></div>}</aside>
}
