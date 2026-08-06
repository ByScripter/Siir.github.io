// SANA ÖZEL API ANAHTARIN:
const API_KEY = "AQ.Ab8RN6Ij5o4eGlm4NgtOMrxCvYvUObGzja4U1nNHpclkgjClZg";

// --- HTML Element Seçimleri ---
const nameInput = document.getElementById('nameInput');
const detailInput = document.getElementById('detailInput');
const generateBtn = document.getElementById('generateBtn');
const themeButtons = document.querySelectorAll('.theme-btn');
const inputSection = document.getElementById('inputSection');
const loadingSection = document.getElementById('loadingSection');
const resultSection = document.getElementById('resultSection');
const poemTitle = document.getElementById('poemTitle');
const poemContent = document.getElementById('poemContent');
const errorMsgContainer = document.getElementById('errorMsgContainer');
const errorMsg = document.getElementById('errorMsg');

const copyBtn = document.getElementById('copyBtn');
const copyMsg = document.getElementById('copyMsg');
const resetBtn = document.getElementById('resetBtn');
const downloadBtn = document.getElementById('downloadBtn');
const readAloudBtn = document.getElementById('readAloudBtn');

const musicBtn = document.getElementById('musicBtn');
const bgMusic = document.getElementById('bgMusic');

// --- Durum (State) Değişkenleri ---
let selectedTheme = "Romantik";
let isMusicPlaying = false;
let isSpeaking = false;
let speechSynth = window.speechSynthesis;
let utterance = null;
let textInterval = null;

// --- Arka Plan Partikülleri Oluşturma ---
function createParticles() {
    const container = document.getElementById('particles');
    const particleCount = 20;
    
    for(let i = 0; i < particleCount; i++) {
        let particle = document.createElement('div');
        particle.classList.add('particle');
        let size = Math.random() * 10 + 5;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        let duration = Math.random() * 10 + 10;
        particle.style.animationDuration = `${duration}s`;
        particle.style.animationDelay = `${Math.random() * 5}s`;
        container.appendChild(particle);
    }
}
// Sayfa yüklendiğinde partikülleri başlat
document.addEventListener('DOMContentLoaded', createParticles);

// --- Müzik Kontrolü ---
musicBtn.addEventListener('click', () => {
    if (isMusicPlaying) {
        bgMusic.pause();
        musicBtn.innerHTML = '<i class="fa-solid fa-music"></i>';
        musicBtn.classList.remove('bg-rose-500', 'text-white');
        musicBtn.classList.add('text-rose-500');
    } else {
        bgMusic.volume = 0.3;
        bgMusic.play().catch(e => console.log("Tarayıcı otomatik oynatmayı engelledi.", e));
        musicBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        musicBtn.classList.add('bg-rose-500', 'text-white');
        musicBtn.classList.remove('text-rose-500');
    }
    isMusicPlaying = !isMusicPlaying;
});

// --- Tema Seçimi ---
themeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // Aktif olanın sınıfını temizle
        document.querySelector('.theme-btn.active').className = "theme-btn bg-white/60 text-slate-700 py-3 rounded-xl font-medium shadow-sm transition-all hover:bg-rose-100";
        // Tıklananı aktif yap
        btn.className = "theme-btn active bg-rose-500 text-white py-3 rounded-xl font-medium shadow-md transition-all hover:bg-rose-600 scale-105";
        selectedTheme = btn.dataset.theme;
    });
});

// --- Hata Gösterme Yardımcı Fonksiyonu ---
function showError(message) {
    errorMsg.textContent = message;
    errorMsgContainer.classList.remove('hidden');
    console.error("Hata Oluştu:", message);
}

function hideError() {
    errorMsgContainer.classList.add('hidden');
    errorMsg.textContent = "";
}

// --- API İle Şiir Üretimi Ana İşlevi ---
generateBtn.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    const detail = detailInput.value.trim();
    
    hideError(); // Varsa eski hatayı gizle

    // Doğrulama
    if(!name) {
        showError("Lütfen onun ismini girin. İsim olmadan şiir yazılamaz.");
        nameInput.classList.add('ring-2', 'ring-red-400');
        setTimeout(() => nameInput.classList.remove('ring-2', 'ring-red-400'), 2000);
        return;
    }

    // Arayüz Değişikliği (Yükleniyor)
    inputSection.classList.add('hidden');
    loadingSection.classList.remove('hidden');
    loadingSection.classList.add('flex');
    
    // Yükleniyor metni animasyonu
    const loadingTexts = [
        "İlham perileri çağrılıyor...", 
        "Kelimeler raks ediyor...", 
        "Sadece ona özel mısralar diziliyor...", 
        "Neredeyse hazır..."
    ];
    let textIndex = 0;
    textInterval = setInterval(() => {
        document.getElementById('loadingText').textContent = loadingTexts[textIndex % loadingTexts.length];
        textIndex++;
    }, 2000);

    // Prompt (Yapay Zeka Komutu) Hazırlığı
    let promptText = `Sen usta ve yetenekli bir şairsin. İsmi "${name}" olan bir kadın için ${selectedTheme} tarzında, çok etkileyici, duygu yüklü bir şiir yaz. `;
    if(detail) {
        promptText += `Şiirde şu detaya da kesinlikle incelikle yer ver: "${detail}". `;
    }
    promptText += `Şiir 3 kıtadan oluşsun. Her kıta 4 mısra olsun. Klişe sözlerden uzak dur, edebi, akıcı ve doğrudan ona (senli/benli) hitap et. Başlık yazma, sadece şiiri ver. Sadece şiirin kendisini döndür.`;

    // API İsteği Gövdesi
    const payload = {
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: { 
            temperature: 0.8,
            maxOutputTokens: 800
        }
    };

    try {
        console.log("API İsteği Başlatılıyor...");
        
        // --- GEMINI API ÇAĞRISI ---
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        // HTTP Hata Kontrolü
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(`API Hatası (${response.status}): ${errData.error?.message || 'Bilinmeyen Hata'}`);
        }

        const result = await response.json();
        console.log("API Yanıtı Alındı:", result);
        
        // Sonucu Ayrıştırma
        if (result.candidates && result.candidates.length > 0 && result.candidates[0].content.parts.length > 0) {
            const generatedText = result.candidates[0].content.parts[0].text;
            clearInterval(textInterval);
            showResult(name, generatedText);
        } else {
            throw new Error("API yanıt verdi ancak şiir metni bulunamadı. Yapı eksik olabilir.");
        }

    } catch (error) {
        // Hata Durumu Arayüzü
        clearInterval(textInterval);
        loadingSection.classList.add('hidden');
        loadingSection.classList.remove('flex');
        inputSection.classList.remove('hidden');
        
        // Kullanıcıya Hatayı Göster
        if(error.message.includes("API key not valid") || error.status === 400) {
           showError("API Anahtarı geçersiz. Lütfen app.js dosyasındaki API_KEY değerini kontrol et.");
        } else {
           showError(error.message);
        }
    }
});

// --- Daktilo Efekti ve Sonucu Gösterme ---
function showResult(name, text) {
    loadingSection.classList.add('hidden');
    loadingSection.classList.remove('flex');
    resultSection.classList.remove('hidden');

    poemTitle.textContent = `Sevgili ${name},`;
    poemContent.textContent = ""; 
    poemContent.classList.add('cursor'); // İmleci ekle
    
    // Markdown işaretlerini (varsa) temizle ve boşlukları ayarla
    const cleanText = text.replace(/```/g, '').trim();
    const chars = cleanText.split('');
    let i = 0;
    
    // Harf harf yazdırma fonksiyonu
    function typeWriter() {
        if (i < chars.length) {
            poemContent.textContent += chars[i];
            i++;
            // Karakterlere göre rastgele hız oluştur (daha doğal daktilo hissi)
            let speed = Math.random() * 30 + 20; 
            if(chars[i] === '\n') speed = 300; // Satır atlamalarında bekle
            
            setTimeout(typeWriter, speed);
        } else {
            poemContent.classList.remove('cursor'); // Bitince imleci kaldır
        }
    }
    
    // Yarım saniye bekleyip yazdırmaya başla
    setTimeout(typeWriter, 500);
}

// --- Kopyala Butonu ---
copyBtn.addEventListener('click', () => {
    const fullText = `${poemTitle.textContent}\n\n${poemContent.textContent}\n\n- Sonsuz sevgilerle`;
    
    // Modern kopyalama yöntemi
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(fullText).then(() => {
            showCopySuccess();
        });
    } else {
        // Eski yöntem (Fallback)
        const textArea = document.createElement("textarea");
        textArea.value = fullText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        showCopySuccess();
    }
});

function showCopySuccess() {
    copyMsg.classList.remove('hidden');
    setTimeout(() => copyMsg.classList.add('hidden'), 2000);
}

// --- Resim Olarak İndir Butonu (html2canvas) ---
downloadBtn.addEventListener('click', () => {
    const card = document.getElementById('poemCard');
    const originalHTML = downloadBtn.innerHTML;
    
    // Butonu yükleniyor durumuna al
    downloadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Hazırlanıyor...';
    downloadBtn.disabled = true;

    // Kartı canvas'a dönüştür
    html2canvas(card, {
        scale: 2, // Daha yüksek çözünürlük
        useCORS: true, // Çapraz köken (cross-origin) hatalarını önler
        backgroundColor: null, // Şeffaf arka planı korur
        logging: false
    }).then(canvas => {
        // Canvas'ı resim dosyasına çevir ve indir
        const link = document.createElement('a');
        link.download = `sana-ozel-siir-${Date.now()}.png`; // Benzersiz isim
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        // Butonu eski haline getir
        downloadBtn.innerHTML = originalHTML;
        downloadBtn.disabled = false;
    }).catch(err => {
        console.error("Resim oluşturma hatası:", err);
        downloadBtn.innerHTML = originalHTML;
        downloadBtn.disabled = false;
        alert("Resim indirilirken bir hata oluştu. Tarayıcı izinlerini kontrol edin.");
    });
});

// --- Sesli Oku Butonu (SpeechSynthesis) ---
readAloudBtn.addEventListener('click', () => {
    if (!('speechSynthesis' in window)) {
        alert("Tarayıcınız sesli okuma özelliğini desteklemiyor.");
        return;
    }

    if (isSpeaking) {
        // Konuşmayı durdur
        speechSynth.cancel();
        readAloudBtn.innerHTML = '<i class="fa-solid fa-volume-high text-rose-500"></i> Sesli Oku';
        isSpeaking = false;
    } else {
        // Konuşmayı başlat
        const textToRead = poemContent.textContent;
        if(!textToRead) return;

        utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.lang = 'tr-TR';
        utterance.rate = 0.85; // Biraz yavaş ve romantik
        utterance.pitch = 0.9;
        
        // Türkçe sesi bulmaya çalış
        const voices = speechSynth.getVoices();
        const trVoices = voices.filter(v => v.lang.includes('tr'));
        if(trVoices.length > 0) {
            // Varsa ilk Türkçe sesi seç
            utterance.voice = trVoices[0]; 
        }

        speechSynth.speak(utterance);
        
        // Arayüzü değiştir
        readAloudBtn.innerHTML = '<i class="fa-solid fa-circle-stop text-red-500"></i> Durdur';
        isSpeaking = true;
        
        // Konuşma bittiğinde butonu eski haline al
        utterance.onend = () => {
            readAloudBtn.innerHTML = '<i class="fa-solid fa-volume-high text-rose-500"></i> Sesli Oku';
            isSpeaking = false;
        };
        
        // Hata yakalama
        utterance.onerror = (e) => {
            console.error("Sesli okuma hatası:", e);
            readAloudBtn.innerHTML = '<i class="fa-solid fa-volume-high text-rose-500"></i> Sesli Oku';
            isSpeaking = false;
        }
    }
});
// Ses listesi yüklendiğinde yenile (Bazı tarayıcılar asenkron yükler)
if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = () => speechSynth.getVoices();
}

// --- Yeni Yaz Butonu ---
resetBtn.addEventListener('click', () => {
    // Sesli okuma varsa durdur
    if(isSpeaking) {
        speechSynth.cancel();
        isSpeaking = false;
        readAloudBtn.innerHTML = '<i class="fa-solid fa-volume-high text-rose-500"></i> Sesli Oku';
    }
    
    // Arayüzü başlangıca döndür
    resultSection.classList.add('hidden');
    inputSection.classList.remove('hidden');
    inputSection.classList.add('animate-fade-in');
    
    // Yukarı kaydır
    window.scrollTo({ top: 0, behavior: 'smooth' });
});