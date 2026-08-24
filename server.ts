import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Initialize Google Gen AI client with recommended headers
let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

const app = express();
const PORT = Number(process.env.PORT || 3000);

// Increase payload limit for base64 image and audio processing
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Google Apps Script License & User Registration/Logging Endpoint
app.post("/api/auth/validate-license", async (req, res) => {
    try {
      const { kode, nama, email, phone } = req.body;

      if (!nama || !email) {
        return res.status(400).json({
          valid: false,
          message: "Data tidak lengkap. Pastikan Nama Lengkap dan Email telah diisi.",
        });
      }

      const cleanKode = (kode || "").toString().trim().toUpperCase();
      const cleanNama = nama.toString().trim();
      const cleanEmail = email.toString().trim().toLowerCase();
      const cleanPhone = (phone || "").toString().trim();

      // Master Access Codes
      const validCodes = [
        "SAKUGENIUSPRO",
        "SAKUGENIUS",
        "SAKU-GENIUS-PRO",
        "DEMO",
        "DEMO-SAKU",
        "SAKU-PRO",
        "VIP-2026",
        "ADMIN-DEV",
      ];

      const isMasterCodeValid = validCodes.includes(cleanKode) || cleanKode.replace(/[^A-Z0-9]/g, "") === "SAKUGENIUSPRO";

      if (!cleanKode) {
        return res.status(400).json({
          valid: false,
          message: "Kode akses wajib diisi. Masukkan kode akses resmi: SAKUGENIUSPRO",
        });
      }

      if (!isMasterCodeValid) {
        return res.status(400).json({
          valid: false,
          message: `Kode akses "${cleanKode}" salah. Silakan masukkan kode akses resmi: SAKUGENIUSPRO`,
        });
      }

      // Automatically sync/record user login data to Google Sheet Web App
      const scriptUrl =
        "https://script.google.com/macros/s/AKfycbwpqIp7RFJsNKZDP_BlOwxT8KcubYg-WPxNmwUCK51vuoZgdYQQj8IXle2HDyauIrUc/exec";

      const nowStr = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
      const queryParams = new URLSearchParams({
        kode: cleanKode,
        nama: cleanNama,
        email: cleanEmail,
        phone: cleanPhone,
        tanggal: nowStr,
        action: "login",
        status: "AKTIF",
      });

      const targetUrl = `${scriptUrl}?${queryParams.toString()}`;

      // Send recording request to Google Sheet
      let remoteMessage = "Data akses Anda telah berhasil dicatat ke Google Sheet Database.";
      try {
        const gasResponse = await fetch(targetUrl, {
          method: "GET",
          headers: {
            "Accept": "application/json, text/plain, */*",
            "User-Agent": "SakuGeniusPro-Client/1.0",
          },
          redirect: "follow",
        });

        if (gasResponse.ok) {
          const rawText = await gasResponse.text();
          try {
            const parsed = JSON.parse(rawText);
            if (parsed.message) {
              remoteMessage = parsed.message;
            }
          } catch {
            // Text response
          }
        }
      } catch (logErr: any) {
        console.warn("GAS logging error:", logErr?.message || logErr);
      }

      // Return success for SAKUGENIUSPRO
      return res.json({
        valid: true,
        message: `Login berhasil! ${remoteMessage}`,
        nama: cleanNama,
        email: cleanEmail,
        phone: cleanPhone,
        kode: cleanKode,
      });
    } catch (error: any) {
      console.error("Error in login authentication:", error);
      return res.status(500).json({
        valid: false,
        message: "Terjadi gangguan sistem verifikasi: " + (error?.message || "Koneksi bermasalah"),
      });
    }
  });

// Helper to call Gemini with automatic model fallback on 503 (high demand) and other transient errors
const GEMINI_MODELS = ["gemini-3.7-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];

async function generateGeminiContentWithFallback(ai: GoogleGenAI, requestConfig: any) {
  let lastError: any = null;

  for (const modelName of GEMINI_MODELS) {
    try {
      const response = await ai.models.generateContent({
        ...requestConfig,
        model: modelName,
      });
      if (response && response.text) {
        return response;
      }
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      console.warn(`[Gemini Fallback] Model ${modelName} encountered error: ${errMsg.slice(0, 120)}... Switching to next model.`);
      // If 503 or 429 or unavailable, continue to next model immediately
    }
  }

  throw lastError || new Error("Semua model AI sedang sibuk. Silakan coba sesaat lagi.");
}

// Heuristic fallback parser for smart text input when AI models are unavailable
function parseSmartTextHeuristic(textPrompt: string, availableCategories: string[] = []) {
  const text = (textPrompt || "").trim();
  const lower = text.toLowerCase();

  // 1. Identify jenis (Pemasukan vs Pengeluaran)
  const isIncome = /gaji|bonus|penjualan|terima|dapat|masuk|transferan|omset|cair|upah|honor|dividen|hadiah|thr|untung/i.test(lower);
  const jenis = isIncome ? "Pemasukan" : "Pengeluaran";

  // 2. Extract nominal (50rb, 50k, 1.5jt, 50.000, 50000, dll)
  let nominal = 0;
  const jtMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:jt|juta|million)/i);
  const rbMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:rb|k|ribu|thousand)/i);
  const plainMatch = lower.match(/(?:rp\.?\s*)?(\d{1,3}(?:\.\d{3})+|\d{4,})/i);
  const smallDigitMatch = lower.match(/(?:rp\.?\s*)?(\d+)/i);

  if (jtMatch) {
    const val = parseFloat(jtMatch[1].replace(",", "."));
    nominal = Math.round(val * 1000000);
  } else if (rbMatch) {
    const val = parseFloat(rbMatch[1].replace(",", "."));
    nominal = Math.round(val * 1000);
  } else if (plainMatch) {
    const cleanStr = plainMatch[1].replace(/\./g, "");
    nominal = parseInt(cleanStr, 10) || 0;
  } else if (smallDigitMatch) {
    nominal = parseInt(smallDigitMatch[1], 10) || 0;
  }

  // 3. Extract date (kemarin, lusa, hari ini)
  const now = new Date();
  let dateStr = now.toISOString().split("T")[0];
  if (/kemarin|kemaren/i.test(lower)) {
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    dateStr = yesterday.toISOString().split("T")[0];
  } else if (/lusa/i.test(lower)) {
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    dateStr = twoDaysAgo.toISOString().split("T")[0];
  }

  // 4. Extract kategori
  let kategori = "Lain-lain";
  if (/makan|minum|kopi|coffee|cafe|resto|restoran|nasi|bakso|mie|ayam|jajan|snack|sate|warung/i.test(lower)) {
    kategori = "Makanan & Minuman";
  } else if (/bensin|pertalite|pertamax|solar|gojek|grab|maxim|parkir|toll|tol|angkot|ojek|kereta|bus|bengkel/i.test(lower)) {
    kategori = "Transportasi";
  } else if (/listrik|pln|pdam|air|wifi|indihome|pulsa|kuota|bpjs|token/i.test(lower)) {
    kategori = "Tagihan & Utilitas";
  } else if (/belanja|supermarket|minimarket|indomaret|alfamart|shopee|tokopedia|baju|sabun|beras|sembako/i.test(lower)) {
    kategori = "Belanja & Kebutuhan";
  } else if (/obat|dokter|klinik|apotek|vitamin|rs|sakit|rawat|periksa/i.test(lower)) {
    kategori = "Kesehatan & Obat";
  } else if (/sekolah|kursus|buku|kuliah|spp|les/i.test(lower)) {
    kategori = "Pendidikan";
  } else if (/bioskop|nonton|game|steam|spotify|netflix|liburan|hotel/i.test(lower)) {
    kategori = "Hiburan";
  } else if (isIncome) {
    if (/gaji|upah|honor/i.test(lower)) kategori = "Gaji";
    else if (/bonus|thr/i.test(lower)) kategori = "Bonus";
    else if (/jual|dagang|toko|omset/i.test(lower)) kategori = "Penjualan";
    else kategori = "Pemasukan Lain";
  }

  if (availableCategories.length > 0) {
    const matched = availableCategories.find((c) => c.toLowerCase() === kategori.toLowerCase());
    if (matched) kategori = matched;
  }

  // Clean nama
  let cleanName = text
    .replace(/(?:rp\.?\s*)?\d+(?:[.,]\d+)?\s*(?:jt|juta|rb|k|ribu|thousand)?/gi, "")
    .replace(/\b(kemarin|kemaren|lusa|tadi|hari ini|bayar|beli|pemasukan|pengeluaran)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanName || cleanName.length < 2) {
    cleanName = text;
  }
  cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

  return {
    nama: cleanName,
    nominal: nominal || 0,
    jenis,
    kategori,
    tanggal: dateStr,
    penjelasan: `Hasil ekstraksi otomatis: ${cleanName} sebesar Rp ${(nominal || 0).toLocaleString("id-ID")}`,
  };
}

// Fallback financial advisor when AI models are unavailable
function getFallbackFinancialAdvice(summary: any, overbudgetCategories: any[] = []): string {
  const income = summary?.income || 0;
  const expense = summary?.expense || 0;
  const expenseRatio = income > 0 ? (expense / income) * 100 : 100;

  let advice = "";
  if (expenseRatio > 90) {
    advice += "1. ⚠️ **Waspada Pengeluaran Tinggi**: Rasio pengeluaran Anda sudah mencapai " + Math.round(expenseRatio) + "% dari pemasukan. Prioritaskan kebutuhan pokok terlebih dahulu.\n\n";
  } else if (expenseRatio > 60) {
    advice += "1. ⚖️ **Kondisi Finansial Cukup Sehat**: Rasio pengeluaran di angka " + Math.round(expenseRatio) + "%. Cobalah sisihkan minimal 20% untuk tabungan dan dana darurat.\n\n";
  } else {
    advice += "1. 🌟 **Kondisi Finansial Sangat Baik**: Anda berhasil menghemat lebih dari " + Math.round(100 - expenseRatio) + "% dari penghasilan. Alokasikan surplus ini ke investasi atau pos impian.\n\n";
  }

  if (overbudgetCategories.length > 0) {
    const overNames = overbudgetCategories.map((c: any) => (typeof c === "string" ? c : c.nama)).join(", ");
    advice += `2. 🔍 **Evaluasi Kategori Melebihi Anggaran**: Kategori *${overNames}* telah melewati batas alokasi. Terapkan batas harian untuk kategori ini di sisa bulan.\n\n`;
  } else {
    advice += "2. 🎯 **Anggaran Terkendali**: Seluruh pos anggaran berjalan sesuai rencana. Pertahankan disiplin pencatatan setiap ada transaksi keluar.\n\n";
  }

  advice += "3. 💡 **Tips Bijak**: Buat daftar belanja sebelum bepergian dan selalu catat pengeluaran kecil harian seperti kopi atau parkir agar tidak luput dari evaluasi akhir bulan.";
  return advice;
}

// AI Endpoint: Scan Receipt / Struk / Bill
  app.post("/api/ai/scan-receipt", async (req, res) => {
    try {
      const { imageBase64, mimeType = "image/jpeg", customPrompt } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: "Foto struk (imageBase64) wajib dikirimkan." });
      }

      // Clean base64 string if data URL prefix exists
      const base64Data = imageBase64.replace(/^data:[^;]+;base64,/, "");

      const ai = getAIClient();
      const prompt = `Analisis foto struk / nota / bill / invoice ini secara teliti.
Ekstrak informasi penting untuk pencatatan keuangan pribadi / rumah tangga:
1. 'nama': Nama merchant / toko / keterangan transaksi utama (contoh: "Indomaret", "Restoran Padang", "SPBU Pertamina", "PLN Listrik").
2. 'tanggal': Tanggal transaksi format YYYY-MM-DD (jika tidak tertera jelas, gunakan tanggal hari ini).
3. 'total': Total nominal pembayaran akhir dalam rupiah (angka bulat positif tanpa desimal, misal 75000).
4. 'kategori': Kategori yang paling sesuai (pilih salah satu yang paling cocok dari: "Makanan & Minuman", "Belanja & Kebutuhan", "Transportasi", "Tagihan & Utilitas", "Kesehatan & Obat", "Pendidikan", "Hiburan", "Lain-lain").
5. 'jenis': "Pengeluaran" (kecuali jika itu slip bukti transfer masuk / pendapatan, set "Pemasukan").
6. 'items': Daftar item barang/jasa yang dibeli (nama item, harga satuan / total, dan kuantitas jika ada).
7. 'ringkasan': Rangkuman singkat mengenai transaksi ini.
${customPrompt ? `Catatan tambahan pengguna: ${customPrompt}` : ""}`;

      const response = await generateGeminiContentWithFallback(ai, {
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              nama: { type: Type.STRING, description: "Nama merchant / toko / transaksi" },
              tanggal: { type: Type.STRING, description: "Format YYYY-MM-DD" },
              total: { type: Type.NUMBER, description: "Total nominal rupiah" },
              kategori: { type: Type.STRING, description: "Kategori pengeluaran" },
              jenis: { type: Type.STRING, description: "'Pengeluaran' atau 'Pemasukan'" },
              ringkasan: { type: Type.STRING, description: "Ringkasan struk" },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    nama: { type: Type.STRING },
                    harga: { type: Type.NUMBER },
                    qty: { type: Type.NUMBER },
                  },
                },
              },
            },
            required: ["nama", "tanggal", "total", "kategori", "jenis"],
          },
        },
      });

      const text = response.text || "{}";
      const parsedData = JSON.parse(text);

      return res.json({
        success: true,
        data: parsedData,
      });
    } catch (error: any) {
      console.error("Error scanning receipt with Gemini:", error);
      return res.status(500).json({
        success: false,
        error: "Model AI sedang mengalami lonjakan permintaan (503). Silakan coba lagi dalam beberapa detik.",
      });
    }
  });

  // AI Endpoint: Process Voice Audio / Audio Recording
  app.post("/api/ai/voice-expense", async (req, res) => {
    try {
      const { audioBase64, mimeType = "audio/webm", availableCategories = [] } = req.body;

      if (!audioBase64) {
        return res.status(400).json({ error: "Data audio (audioBase64) wajib dikirimkan." });
      }

      const base64Data = audioBase64.replace(/^data:[^;]+;base64,/, "");
      const ai = getAIClient();

      const categoriesList = availableCategories.length > 0 
        ? availableCategories.join(", ") 
        : "Makanan & Minuman, Belanja & Kebutuhan, Transportasi, Tagihan & Utilitas, Gaji, Bonus, Lain-lain";

      const prompt = `Dengarkan rekaman suara pengguna yang sedang mencatat keuangan rumah tangga / pengeluaran / pemasukan.
Tugasmu:
1. Transkripsikan apa yang diucapkan oleh pengguna dalam bahasa Indonesia.
2. Identifikasi:
   - 'nama': Keterangan transaksi (misal: "Beli Bensin Pertalite", "Makan Siang Nasi Goreng", "Gaji Bulanan", "Belanja Bulanan").
   - 'nominal': Jumlah uang dalam rupiah (angka bulat positif, misalnya jika bilang 'lima puluh ribu' maka 50000, 'tiga ratus lima puluh ribu' maka 350000).
   - 'jenis': "Pengeluaran" atau "Pemasukan".
   - 'kategori': Kategori yang paling sesuai dari daftar berikut: [${categoriesList}].
   - 'tanggal': Tanggal transaksi format YYYY-MM-DD (jika tidak disebut spesifik tanggal berapa atau kemarin/lusa, gunakan tanggal hari ini: ${new Date().toISOString().split("T")[0]}).
   - 'catatan': Transkrip lengkap kalimat yang diucapkan pengguna.`;

      const response = await generateGeminiContentWithFallback(ai, {
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              nama: { type: Type.STRING, description: "Keterangan nama transaksi" },
              nominal: { type: Type.NUMBER, description: "Nominal uang dalam rupiah" },
              jenis: { type: Type.STRING, description: "'Pengeluaran' atau 'Pemasukan'" },
              kategori: { type: Type.STRING, description: "Kategori yang cocok" },
              tanggal: { type: Type.STRING, description: "Format YYYY-MM-DD" },
              catatan: { type: Type.STRING, description: "Transkrip suara pengguna" },
            },
            required: ["nama", "nominal", "jenis", "kategori", "tanggal"],
          },
        },
      });

      const text = response.text || "{}";
      const parsedData = JSON.parse(text);

      return res.json({
        success: true,
        data: parsedData,
      });
    } catch (error: any) {
      console.error("Error processing voice with Gemini:", error);
      return res.status(500).json({
        success: false,
        error: "Layanan suara AI sedang sibuk sementara. Anda juga dapat menggunakan input teks cerdas.",
      });
    }
  });

  // AI Endpoint: Smart Natural Language Text Parser
  app.post("/api/ai/smart-text", async (req, res) => {
    const { textPrompt, availableCategories = [] } = req.body;

    if (!textPrompt || typeof textPrompt !== "string") {
      return res.status(400).json({ error: "Teks (textPrompt) wajib diisi." });
    }

    try {
      const ai = getAIClient();
      const categoriesList = availableCategories.length > 0 
        ? availableCategories.join(", ") 
        : "Makanan & Minuman, Belanja & Kebutuhan, Transportasi, Tagihan & Utilitas, Gaji, Bonus, Lain-lain";

      const prompt = `Analisis kalimat input keuangan pengguna berikut: "${textPrompt}"
Ekstrak data transaksi keuangan secara cerdas:
- 'nama': Keterangan transaksi ringkas dan jelas.
- 'nominal': Jumlah nominal dalam rupiah (angka bulat positif, cth: 25000 untuk '25rb', 1500000 untuk '1.5jt').
- 'jenis': "Pengeluaran" atau "Pemasukan".
- 'kategori': Kategori paling pas dari: [${categoriesList}].
- 'tanggal': Tanggal format YYYY-MM-DD (hari ini: ${new Date().toISOString().split("T")[0]}, jika disebut 'kemarin' sesuaikan -1 hari).
- 'penjelasan': Penjelasan singkat parsing.`;

      const response = await generateGeminiContentWithFallback(ai, {
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              nama: { type: Type.STRING },
              nominal: { type: Type.NUMBER },
              jenis: { type: Type.STRING },
              kategori: { type: Type.STRING },
              tanggal: { type: Type.STRING },
              penjelasan: { type: Type.STRING },
            },
            required: ["nama", "nominal", "jenis", "kategori", "tanggal"],
          },
        },
      });

      const text = response.text || "{}";
      const parsedData = JSON.parse(text);

      return res.json({
        success: true,
        data: parsedData,
      });
    } catch (error: any) {
      console.warn("Gemini smart text failed, using heuristic fallback parser:", error?.message || error);
      // Seamlessly fallback to offline/heuristic NLP parser so user is NEVER blocked by 503
      const fallbackResult = parseSmartTextHeuristic(textPrompt, availableCategories);
      return res.json({
        success: true,
        data: fallbackResult,
        fallback: true,
      });
    }
  });

  // AI Endpoint: Financial Advisory / Analisis Keuangan
  app.post("/api/ai/financial-advice", async (req, res) => {
    const { summary, overbudgetCategories = [] } = req.body;
    try {
      const ai = getAIClient();

      const prompt = `Anda adalah konsultan keuangan keluarga & rumah tangga yang ramah, bijak, dan solutif (SakuGenius Financial Advisor).
Berikut data ringkasan keuangan pengguna bulan ini:
- Total Pemasukan: Rp ${summary?.income?.toLocaleString("id-ID") || 0}
- Total Pengeluaran: Rp ${summary?.expense?.toLocaleString("id-ID") || 0}
- Sisa Saldo: Rp ${summary?.balance?.toLocaleString("id-ID") || 0}
- Kategori Overbudget: ${overbudgetCategories.length > 0 ? JSON.stringify(overbudgetCategories) : "Tidak ada"}

Berikan 3-4 saran finansial praktis, singkat, padat, dan memotivasi dalam bahasa Indonesia yang ramah.`;

      const response = await generateGeminiContentWithFallback(ai, {
        contents: prompt,
      });

      return res.json({
        success: true,
        advice: response.text || getFallbackFinancialAdvice(summary, overbudgetCategories),
      });
    } catch (error: any) {
      console.warn("Gemini financial advice failed, using smart heuristic advice:", error?.message || error);
      return res.json({
        success: true,
        advice: getFallbackFinancialAdvice(summary, overbudgetCategories),
        fallback: true,
      });
    }
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== "production") {
    createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    }).then((vite) => {
      app.use(vite.middlewares);
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`SakuGenius Dev Server running on http://localhost:${PORT}`);
      });
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    
    // Only listen manually if not running in Vercel Serverless environment
    if (!process.env.VERCEL) {
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`SakuGenius Prod Server running on port ${PORT}`);
      });
    }
  }

export default app;