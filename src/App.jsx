import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, CircleHelp, Clock3, Compass, Crown, Gamepad2, GraduationCap, Home, Layers3, LockKeyhole, Plus, Search, Share2, Sparkles, Trophy, Users, X, Zap } from 'lucide-react'

const starter = [
  { id:'demo-1', title:'Genel Kültür: Büyük Meydan Okuma', category:'Genel kültür', questions:[
    {text:'Dünyanın en büyük okyanusu hangisidir?',options:['Atlas','Hint','Pasifik','Arktik'],answer:2,seconds:20},
    {text:'Bir yılda kaç ay vardır?',options:['10','11','12','13'],answer:2,seconds:15},
    {text:'Güneş sisteminin en büyük gezegeni hangisidir?',options:['Dünya','Jüpiter','Mars','Venüs'],answer:1,seconds:20},
    {text:'Japonya’nın başkenti neresidir?',options:['Seul','Pekin','Tokyo','Bangkok'],answer:2,seconds:20}
  ],plays:128,createdAt:Date.now()},
  { id:'demo-2', title:'Bilim Dünyası', category:'Bilim', questions:[
    {text:'Suyun kimyasal formülü nedir?',options:['CO2','H2O','O2','NaCl'],answer:1,seconds:15},
    {text:'İnsan vücudundaki en büyük organ hangisidir?',options:['Kalp','Karaciğer','Deri','Akciğer'],answer:2,seconds:20},
    {text:'Işık yılı neyi ölçer?',options:['Zamanı','Mesafeyi','Hızı','Enerjiyi'],answer:1,seconds:20}
  ],plays:95,createdAt:Date.now()},
  { id:'demo-3', title:'Tarihte Yolculuk', category:'Tarih', questions:[
    {text:'İstanbul hangi yıl fethedildi?',options:['1071','1299','1453','1923'],answer:2,seconds:20},
    {text:'Türkiye Cumhuriyeti hangi yıl ilan edildi?',options:['1919','1920','1922','1923'],answer:3,seconds:15},
    {text:'Piramitleriyle ünlü antik uygarlık hangisidir?',options:['Roma','Mısır','Maya','Pers'],answer:1,seconds:20}
  ],plays:76,createdAt:Date.now()},
  { id:'demo-4', title:'Dünya Coğrafyası', category:'Coğrafya', questions:[
    {text:'Dünyanın en yüksek dağı hangisidir?',options:['K2','Everest','Kilimanjaro','Ağrı'],answer:1,seconds:20},
    {text:'Türkiye kaç coğrafi bölgeye ayrılır?',options:['5','6','7','8'],answer:2,seconds:15},
    {text:'Nil Nehri hangi kıtadadır?',options:['Asya','Avrupa','Afrika','Amerika'],answer:2,seconds:20}
  ],plays:64,createdAt:Date.now()},
  { id:'demo-5', title:'Matematik Hız Testi', category:'Matematik', questions:[
    {text:'12 × 8 kaç eder?',options:['86','92','96','108'],answer:2,seconds:10},
    {text:'144 sayısının karekökü kaçtır?',options:['10','11','12','14'],answer:2,seconds:15},
    {text:'Bir üçgenin iç açıları toplamı kaç derecedir?',options:['90','180','270','360'],answer:1,seconds:15}
  ],plays:53,createdAt:Date.now()},
  { id:'demo-6', title:'Teknoloji ve İnternet', category:'Teknoloji', questions:[
    {text:'HTML ne için kullanılır?',options:['Web sayfası yapısı','Veritabanı','İşletim sistemi','Ekran kartı'],answer:0,seconds:20},
    {text:'CPU bilgisayarda neyi ifade eder?',options:['Bellek','İşlemci','Depolama','Ekran'],answer:1,seconds:15},
    {text:'İkili sayı sisteminde hangi rakamlar kullanılır?',options:['0 ve 1','1 ve 2','0-9','A ve B'],answer:0,seconds:15}
  ],plays:88,createdAt:Date.now()},
  { id:'demo-7', title:'Oyun Dünyası', category:'Oyunlar', questions:[
    {text:'Minecraft hangi tür bir oyundur?',options:['Yarış','Sandbox','Futbol','Dövüş'],answer:1,seconds:15},
    {text:'Satrançta her oyuncu oyuna kaç taşla başlar?',options:['12','14','16','18'],answer:2,seconds:20},
    {text:'Pac-Man neyi yemeye çalışır?',options:['Yıldızları','Noktaları','Meyveleri','Anahtarları'],answer:1,seconds:15}
  ],plays:142,createdAt:Date.now()},
  { id:'demo-8', title:'Spor Arenası', category:'Spor', questions:[
    {text:'Bir futbol takımı sahada kaç oyuncuyla oynar?',options:['9','10','11','12'],answer:2,seconds:15},
    {text:'Olimpiyat halkaları kaç tanedir?',options:['4','5','6','7'],answer:1,seconds:15},
    {text:'Basketbolda serbest atış kaç puandır?',options:['1','2','3','4'],answer:0,seconds:15}
  ],plays:91,createdAt:Date.now()},
  { id:'demo-9', title:'Film ve Eğlence', category:'Eğlence', questions:[
    {text:'Oscar ödülleri hangi alanla tanınır?',options:['Sinema','Bilim','Spor','Müzik'],answer:0,seconds:15},
    {text:'Bir filmde hikâyeyi yöneten kişiye ne denir?',options:['Editör','Yönetmen','Sunucu','Besteci'],answer:1,seconds:15}
  ],plays:69,createdAt:Date.now()},
  { id:'demo-10', title:'Doğa ve Hayvanlar', category:'Doğa', questions:[
    {text:'En hızlı kara hayvanı hangisidir?',options:['Aslan','Çita','At','Kurt'],answer:1,seconds:15},
    {text:'Arılar hangi besini üretir?',options:['Süt','Bal','Peynir','Nektar'],answer:1,seconds:15},
    {text:'Bitkiler fotosentez sırasında hangi gazı alır?',options:['Oksijen','Azot','Karbondioksit','Hidrojen'],answer:2,seconds:20}
  ],plays:47,createdAt:Date.now()}
]
const colors = ['#7357f6', '#18a999', '#ffad42', '#ed6684']
const loadQuizzes = () => { try { return JSON.parse(localStorage.getItem('quizup-quizzes') || '[]') } catch { return [] } }

export default function App() {
  const [page, setPage] = useState('home')
  const [quizzes, setQuizzes] = useState(loadQuizzes)
  const [search, setSearch] = useState('')
  const [activeQuiz, setActiveQuiz] = useState(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answers, setAnswers] = useState([])
  const [gameMode, setGameMode] = useState('classic')
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [category, setCategory] = useState('Tümü')
  const [editor, setEditor] = useState({ title: '', category: 'Genel kültür', questions: [{ text: '', options: ['', '', '', ''], answer: 0, seconds: 20 }] })
  const [pin, setPin] = useState('')
  const [notice, setNotice] = useState('')
  useEffect(() => localStorage.setItem('quizup-quizzes', JSON.stringify(quizzes)), [quizzes])
  const allQuizzes = useMemo(() => [...starter, ...quizzes], [quizzes])
  const filtered = allQuizzes.filter(q => (category === 'Tümü' || q.category === category) && (q.title.toLocaleLowerCase('tr').includes(search.toLocaleLowerCase('tr')) || q.category.toLocaleLowerCase('tr').includes(search.toLocaleLowerCase('tr'))))
  const categories = ['Tümü', ...new Set(allQuizzes.map(q => q.category))]
  const go = p => { setPage(p); setNotice(''); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const updateQuestion = (idx, key, value) => setEditor(old => ({ ...old, questions: old.questions.map((q, i) => i === idx ? { ...q, [key]: value } : q) }))
  const updateOption = (qi, oi, value) => setEditor(old => ({ ...old, questions: old.questions.map((q, i) => i === qi ? { ...q, options: q.options.map((o, j) => j === oi ? value : o) } : q) }))
  const publish = () => {
    if (!editor.title.trim()) return setNotice('Yarışmana bir isim vermelisin.')
    if (!editor.questions.length || editor.questions.some(q => !q.text.trim() || q.options.some(o => !o.trim()))) return setNotice('Her soruyu ve dört seçeneğini doldurmalısın.')
    const quiz = { ...editor, id: crypto.randomUUID(), plays: 0, createdAt: Date.now() }
    setQuizzes(old => [quiz, ...old]); setEditor({ title: '', category: 'Genel kültür', questions: [{ text: '', options: ['', '', '', ''], answer: 0, seconds: 20 }] })
    setNotice('Yarışma bu tarayıcıya kaydedildi. Herkese açık yayınlama için hesap ve çevrim içi veritabanı bağlantısı sonraki aşamada eklenecek.')
    setPage('my')
  }
  const startQuiz = quiz => { setActiveQuiz(quiz); setQuestionIndex(0); setAnswers([]); setSelected(null); go('modes') }
  const launchMode = mode => { setGameMode(mode); setQuestionIndex(0); setAnswers([]); setSelected(null); setSecondsLeft(mode === 'rush' ? Math.min(activeQuiz.questions[0]?.seconds || 10, 10) : (activeQuiz.questions[0]?.seconds || 20)); setPage('play'); window.scrollTo({top:0,behavior:'smooth'}) }
  const advance = next => { setAnswers(next); setSelected(null); if (questionIndex + 1 >= activeQuiz.questions.length) go('result'); else { const i = questionIndex + 1; setQuestionIndex(i); setSecondsLeft(gameMode === 'rush' ? Math.min(activeQuiz.questions[i]?.seconds || 10, 10) : (activeQuiz.questions[i]?.seconds || 20)) } }
  const answerQuestion = () => {
    if (selected === null) return
    advance([...answers, selected])
  }
  const correctCount = activeQuiz ? activeQuiz.questions.reduce((n,q,i)=>n+(answers[i]===q.answer?1:0),0) : 0
  const score = correctCount * (gameMode === 'accuracy' || gameMode === 'practice' ? 100 : 100)
  useEffect(() => { if (page !== 'play' || gameMode === 'practice') return; const timer = setInterval(() => setSecondsLeft(v => Math.max(0,v-1)), 1000); return () => clearInterval(timer) }, [page,questionIndex,gameMode])
  useEffect(() => { if (page === 'play' && gameMode !== 'practice' && secondsLeft === 0) advance([...answers, -1]) }, [secondsLeft])
  const NavButton = ({ icon: Icon, label, target, active }) => <button className={'nav-item ' + (active ? 'active' : '')} onClick={() => go(target)}><Icon size={18}/><span>{label}</span></button>
  return <div className="app-shell">
    <header className="topbar"><button className="brand" onClick={() => go('home')}><span className="brand-mark"><Zap size={21} fill="currentColor"/></span><span>quiz<span className="brand-light">up</span><i>.</i></span></button>
      <nav className="desktop-nav"><NavButton icon={Home} label="Ana sayfa" target="home" active={page === 'home'}/><NavButton icon={Compass} label="Keşfet" target="discover" active={page === 'discover'}/><NavButton icon={Layers3} label="Yarışmalarım" target="my" active={page === 'my'}/></nav>
      <div className="top-actions"><button className="login-btn" onClick={() => setNotice('Hesap sistemi, yarışmaların cihazlar arasında saklanmasıyla birlikte eklenecek.')}>Giriş yap</button><button className="primary small" onClick={() => go('create')}><Plus size={17}/> Oluştur</button><button className="mobile-menu" onClick={() => go('discover')}><Compass/></button></div>
    </header>
    <main>
      {page === 'home' && <><section className="hero"><div className="hero-copy"><div className="eyebrow"><Sparkles size={15}/> ÖĞRENMEK HİÇ BU KADAR EĞLENCELİ OLMAMIŞTI</div><h1>Bilgini konuştur.<br/><span>Oyuna dönüştür.</span></h1><p>Kendi bilgi yarışmanı oluştur, arkadaşlarına meydan oku ve eğlenirken öğren. QuizUp'ta sıra sende!</p><div className="hero-buttons"><button className="primary" onClick={() => go('create')}><Plus size={19}/> Yarışma oluştur</button><button className="secondary" onClick={() => go('discover')}><Compass size={18}/> Yarışmaları keşfet</button></div><div className="hero-proof"><div className="avatar-stack"><b>Q</b><b>U</b><b>!</b></div><span><strong>Hayalindeki yarışmayı oluştur</strong><br/>Ücretsiz başla, hemen oyna.</span></div></div><div className="hero-art"><div className="art-orbit orbit-one"></div><div className="art-orbit orbit-two"></div><div className="quiz-card"><div className="quiz-card-top"><span>QUIZUP CHALLENGE</span><span className="live-dot">● CANLI TASARIM</span></div><div className="mini-trophy"><Trophy size={44}/></div><h3>Hazır mısın?</h3><p>Bilgini test et ve zirveye çık!</p><div className="mini-answers"><span>🚀 Uzay</span><span>🧠 Bilim</span><span>🌍 Dünya</span><span>🎮 Oyun</span></div><div className="mini-progress"><i/></div></div><div className="float-chip chip-one"><Trophy size={17}/> <b>1. sıra</b></div><div className="float-chip chip-two"><Zap size={17} fill="currentColor"/> +950 puan</div><div className="sparkle s1">✦</div><div className="sparkle s2">✧</div></div></section>
        <section className="feature-strip"><div><span className="feature-icon purple"><Gamepad2/></span><span><b>Oyna ve öğren</b><small>Bilgini eğlenceyle geliştir</small></span></div><div><span className="feature-icon orange"><Crown/></span><span><b>Zirveye yüksel</b><small>Puanını ve başarını gör</small></span></div><div><span className="feature-icon green"><Users/></span><span><b>Birlikte yarış</b><small>Arkadaşlarına meydan oku</small></span></div></section>
        <section className="section"><div className="section-heading"><div><span className="eyebrow">SENİ NELER BEKLİYOR?</span><h2>QuizUp dünyasını keşfet</h2></div><button className="text-link" onClick={() => go('discover')}>Tüm yarışmalar <ArrowRight size={16}/></button></div><div className="feature-cards"><button className="feature-card card-purple" onClick={() => go('create')}><span className="big-icon"><Plus size={28}/></span><h3>Kendi yarışmanı oluştur</h3><p>Sorularını yaz, seçeneklerini belirle ve kendi bilgi oyununun sunucusu ol.</p><span className="card-link">Hemen oluştur <ArrowRight size={16}/></span></button><button className="feature-card card-orange" onClick={() => go('discover')}><span className="big-icon"><Compass size={28}/></span><h3>Yeni şeyler keşfet</h3><p>Farklı konulardaki yarışmalara göz at, kendini test et.</p><span className="card-link">Keşfetmeye başla <ArrowRight size={16}/></span></button><button className="feature-card card-green" onClick={() => go('join')}><span className="big-icon"><Users size={28}/></span><h3>PIN ile oyuna katıl</h3><p>Bir oyun kodun varsa arkadaşlarının yarışmasına katıl.</p><span className="card-link">PIN gir <ArrowRight size={16}/></span></button></div></section></>}
      {page === 'discover' && <section className="page-section"><div className="page-heading"><div><span className="eyebrow">KEŞFET</span><h1>Bir yarışma seç, <span>başla!</span></h1><p>İlgini çeken konuyu bul ve bilgini test et.</p></div></div><div className="search-box"><Search size={19}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Yarışma veya kategori ara..."/></div><div className="quiz-grid">{filtered.map((q, i) => <QuizTile key={q.id} quiz={q} index={i} onClick={() => startQuiz(q)}/>)}{filtered.length === 0 && <div className="empty-state"><CircleHelp size={32}/><h3>Burada henüz yarışma yok</h3><p>Aramana uygun bir yarışma bulamadık.</p></div>}</div><p className="local-note"><LockKeyhole size={14}/> Şu an örnek yarışmalar ve bu cihazda oluşturduğun yarışmalar listelenir.</p></section>}
      {page === 'my' && <section className="page-section"><div className="page-heading split"><div><span className="eyebrow">KÜTÜPHANEM</span><h1>Yarışmalarım</h1><p>Bu tarayıcıda oluşturduğun yarışmalar.</p></div><button className="primary" onClick={() => go('create')}><Plus size={18}/> Yeni yarışma</button></div>{quizzes.length ? <div className="quiz-grid">{quizzes.map((q, i) => <QuizTile key={q.id} quiz={q} index={i} onClick={() => startQuiz(q)}/>)}</div> : <div className="empty-state large"><BookOpen size={38}/><h3>Henüz yarışman yok</h3><p>İlk yarışmanı oluştur ve QuizUp maceranı başlat.</p><button className="primary" onClick={() => go('create')}><Plus size={17}/> İlk yarışmanı oluştur</button></div>}</section>}
      {page === 'create' && <section className="page-section editor-page"><button className="back-link" onClick={() => go('home')}><ArrowLeft size={17}/> Ana sayfa</button><div className="page-heading"><span className="eyebrow">YARIŞMA STÜDYOSU</span><h1>Haydi bir şeyler <span>oluşturalım!</span></h1><p>Sorularını ekle, doğru cevapları seç ve yarışmanı hazırla.</p></div><div className="editor-layout"><div className="editor-main"><div className="panel"><div className="panel-title"><span className="step-number">1</span><div><h3>Yarışma bilgileri</h3><p>Yarışmanın temel bilgilerini belirle.</p></div></div><label className="field-label">Yarışma adı</label><input className="field" value={editor.title} onChange={e => setEditor(v => ({ ...v, title: e.target.value }))} placeholder="Örn. Eğlenceli genel kültür testi"/><label className="field-label">Kategori</label><select className="field" value={editor.category} onChange={e => setEditor(v => ({ ...v, category: e.target.value }))}>{['Genel kültür','Bilim','Tarih','Coğrafya','Matematik','Teknoloji','Oyunlar','Eğlence'].map(c => <option>{c}</option>)}</select></div>
        {editor.questions.map((q, qi) => <div className="panel question-panel" key={qi}><div className="panel-title"><span className="step-number">{qi + 2}</span><div><h3>{qi + 1}. Soru</h3><p>Bir soru yaz ve doğru cevabı işaretle.</p></div><button className="icon-btn danger" onClick={() => setEditor(v => ({ ...v, questions: v.questions.filter((_, i) => i !== qi) }))} disabled={editor.questions.length === 1}><X size={18}/></button></div><textarea className="field question-input" value={q.text} onChange={e => updateQuestion(qi, 'text', e.target.value)} placeholder="Sorunu buraya yaz..."/><div className="option-grid">{q.options.map((o, oi) => <label className={'option-input option-' + oi} key={oi}><span>{String.fromCharCode(65 + oi)}</span><input value={o} onChange={e => updateOption(qi, oi, e.target.value)} placeholder={'Seçenek ' + (oi + 1)}/><button type="button" title="Doğru cevap olarak işaretle" className={q.answer === oi ? 'correct-check selected' : 'correct-check'} onClick={() => updateQuestion(qi, 'answer', oi)}>{q.answer === oi ? <Check size={15}/> : <span/>}</button></label>)}</div><div className="timer-row"><Clock3 size={16}/><span>Soru süresi</span><select value={q.seconds} onChange={e => updateQuestion(qi, 'seconds', Number(e.target.value))}><option value="10">10 saniye</option><option value="15">15 saniye</option><option value="20">20 saniye</option><option value="30">30 saniye</option><option value="60">60 saniye</option></select></div></div>)}<button className="add-question" onClick={() => setEditor(v => ({ ...v, questions: [...v.questions, { text: '', options: ['', '', '', ''], answer: 0, seconds: 20 }] }))}><Plus size={18}/> Soru ekle</button></div><aside className="editor-aside"><div className="tip-card"><Sparkles size={21}/><h3>Küçük bir ipucu</h3><p>Sorularını kısa ve anlaşılır tut. Doğru cevabı seçeneklerin yanındaki daireye dokunarak seçebilirsin.</p></div><div className="save-card"><h3>Yarışman hazır mı?</h3><p>{editor.questions.length} soru ekledin. Dilediğin zaman düzenleyebilirsin.</p><button className="primary full" onClick={publish}>Kaydet <ArrowRight size={17}/></button><small><LockKeyhole size={13}/> Şimdilik yalnızca bu tarayıcıya kaydedilir.</small></div></aside></div></section>}
      {page === 'join' && <section className="join-wrap"><div className="join-card"><div className="join-icon"><Gamepad2 size={32}/></div><span className="eyebrow">OYUNA KATIL</span><h1>PIN kodunu gir!</h1><p>Bir yarışma sunucusundan aldığın oyun kodunu buraya yaz.</p><input className="pin-input" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000 000" inputMode="numeric" maxLength={6}/><button className="primary full" onClick={() => setNotice('Canlı oda sistemi henüz sunucuya bağlanmadı. PIN ile gerçek zamanlı oyun için sonraki aşamada ortak veritabanı ve canlı bağlantı kurulacak.')}>Oyuna katıl <ArrowRight size={18}/></button><small>Canlı çok oyunculu oyun altyapısı sonraki aşamada etkinleştirilecek.</small></div></section>}
      {page === 'play' && activeQuiz && <section className="play-wrap"><div className="play-top"><button className="back-link" onClick={() => go('discover')}><X size={18}/> Çık</button><span>{activeQuiz.title}</span><span className="question-count">{questionIndex + 1} / {activeQuiz.questions.length}</span></div><div className="play-progress"><i style={{ width: ((questionIndex + 1) / activeQuiz.questions.length * 100) + '%' }}/></div><div className="play-card"><span className="eyebrow">SORU {questionIndex + 1}</span><h1>{activeQuiz.questions[questionIndex].text}</h1><div className="play-options">{activeQuiz.questions[questionIndex].options.map((o, i) => <button key={i} className={'play-option p' + i + (selected === i ? ' chosen' : '')} onClick={() => setSelected(i)}><b>{String.fromCharCode(65 + i)}</b>{o}{selected === i && <Check size={19}/>}</button>)}</div><button className="primary next-btn" disabled={selected === null} onClick={answerQuestion}>{questionIndex + 1 === activeQuiz.questions.length ? 'Sonucu gör' : 'Sonraki soru'} <ArrowRight size={18}/></button></div></section>}
      {page === 'result' && activeQuiz && <section className="join-wrap"><div className="result-card"><div className="result-trophy"><Trophy size={40}/></div><span className="eyebrow">YARIŞMA TAMAMLANDI</span><h1>Harika iş çıkardın!</h1><div className="score-number">{score}<small> / {activeQuiz.questions.length}</small></div><p>{activeQuiz.questions.length ? Math.round(score / activeQuiz.questions.length * 100) : 0}% doğru cevap</p><div className="result-actions"><button className="primary" onClick={() => startQuiz(activeQuiz)}>Tekrar oyna</button><button className="secondary" onClick={() => go('discover')}>Diğer yarışmalar</button></div></div></section>}
    </main>
    <footer><button className="brand footer-brand" onClick={() => go('home')}><span className="brand-mark"><Zap size={18} fill="currentColor"/></span><span>quiz<span className="brand-light">up</span><i>.</i></span></button><span>Bilgini konuştur. Oyuna dönüştür.</span><span>© 2026 QuizUp</span></footer>
    {notice && <div className="toast"><span>{notice}</span><button onClick={() => setNotice('')}><X size={17}/></button></div>}
  </div>
}

function QuizTile({ quiz, index, onClick }) {
  return <button className="quiz-tile" onClick={onClick}><div className="tile-art" style={{ background: ['linear-gradient(135deg,#7861f8,#a994ff)','linear-gradient(135deg,#18a999,#65d6b5)','linear-gradient(135deg,#ffad42,#ffd17c)','linear-gradient(135deg,#ec6685,#ff9db1)'][index % 4] }}><span className="tile-symbol">{['🧠','🌍','🚀','🎮'][index % 4]}</span><span className="tile-tag">{quiz.category}</span></div><div className="tile-info"><h3>{quiz.title}</h3><div><span><CircleHelp size={14}/> {quiz.questions.length} soru</span><span><Trophy size={14}/> QuizUp</span></div></div><span className="tile-arrow"><ArrowRight size={18}/></span></button>
}