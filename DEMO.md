# $RIOT Chat Wallet - Demo Script

## Judging Demo Flow (3-5 menit)

### Step 1: Connect Wallet (30 detik)
1. Buka [riot-chat-wallet-temp.vercel.app](https://riot-chat-wallet-temp.vercel.app)
2. Klik **CONNECT WALLET** → pilih Sui wallet (Sui Wallet / Martian / OKX)
3. Accept connection
4. ✅ Wallet address muncul di sidebar kiri, balance otomatis terdeteksi

### Step 2: Chat dengan Agent (1 menit)
1. Dari sidebar kiri, klik agent **🌐 J6 - The Network**
2. Tulis: `"check current SUI price and recent cross-chain activity"`
3. Agent merespon dengan data real-time dari blockchain
4. Kirim 2-3 pesan lagi untuk membangun memori
5. Ganti agent ke **💼 J8 - The Broker**
6. Tulis: `"what's the best DeFi yield strategy right now?"`

### Step 3: Bukti Tatum Integration (30 detik)
1. Klik **BLOCKCHAIN VERIFY** di panel bawah
2. Lihat balance wallet SUI terdeteksi via Tatum RPC
3. (Jika ada TX history) Lihat transaksi dari wallet
4. > Tatum API key telah digunakan 100k/100k credits — integrasi nyata dan penuh

### Step 4: Walrus Memory Archive (1 menit)
1. Klik **SHOW MEMORY** di panel bawah
2. **User Profile** — lihat nama wallet, jumlah session, blob ID terakhir
3. **Visited Agents** — lihat agent Network (J6) dan Broker (J8) terhighlight
4. Klik agent Network → lihat semua blobs yang tersimpan di Walrus untuk agent ini
5. Klik link **View ↗** pada blob ID → buka aggregator Walrus testnet, buktikan data tersimpan on-chain
6. Klik **< BACK TO AGENTS**
7. Scroll ke **ALL BLOBS** — lihat semua blobs dari semua agents dalam urutan kronologis

### Step 5: Search Memory (30 detik)
1. (Jika search bar ada) Ketik nama agent di search
2. Lihat hasil filter — hanya blobs agent tersebut

### Step 6: Walrus On-Chain Verification (30 detik)
1. Buka [Walrus Testnet Aggregator](https://aggregator.walrus-testnet.walrus.space)
2. Paste salah satu blob_id dari MEMORY ARCHIVE
3. ✅ Lihat data chat terenkripsi tersimpan di Walrus — desentralisasi, permanen

---

## Key Talking Points untuk Juri

### "Why Walrus?"
- Setiap percakapan chat **auto-save ke Walrus** sebagai blob
- Blob dapat diverifikasi publik via aggregator
- Data tidak hilang — Walrus menjamin ketersediaan
- **Blob history** — semua interaksi agent terekam on-chain

### "Why Tatum?"
- **Tatum RPC** — balance wallet real-time di berbagai chain
- **100k credits digunakan penuh** — integrasi mendalam (RPC + AI) 
- Satu API untuk semua chain — efisiensi developer

### "Why $RIOT?"
- **25 agent AI** dengan personality unik — bukan chatbot biasa
- **Memory per-wallet** — setiap user punya konteks sendiri
- **Cyberpunk aesthetic** — UI/UX yang memorable
- **Modular** — agents bisa ditambah, diganti, di-customize

---

## Live Demo Link
- **App:** https://riot-chat-wallet-temp.vercel.app
- **Backend API:** https://riot-chat-wallet.onrender.com
- **GitHub:** https://github.com/cryptoriot666/riot-chat-wallet
- **Walrus Explorer:** https://aggregator.walrus-testnet.walrus.space

---

## Jika Juri Ingin Mencoba Sendiri
1. Install Sui Wallet extension
2. Switch ke Testnet
3. Dapatkan test SUI dari faucet
4. Buka app, connect wallet, mulai chat
5. Setelah 5+ pesan, buka MEMORY → lihat blobs tersimpan
