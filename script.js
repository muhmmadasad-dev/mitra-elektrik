const WHATSAPP_NUMBER = "6282240000226";

// Konfigurasi Supabase
const SUPABASE_URL = "https://ofptflgbezynrlhjridt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_8q5vCdcxftak7WmB8t48Tw_i58-NfB2";
const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

let products = [];

const formatRupiah = (harga) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(Number(harga) || 0);
};

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function buatLinkWhatsApp(produk) {
    const pesan = `Halo Mitra Elektrik, saya ingin bertanya tentang ${produk.name} (SKU: ${produk.sku}). Apakah barang tersedia?`;

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(pesan)}`;
}

function getKetersediaan(produk) {
    if (produk.qty === null || produk.qty === undefined || produk.qty === "") {
        return "Tanyakan ketersediaan";
    }

    return Number(produk.qty) > 0 ? "Tersedia" : "Stok habis";
}


function buatKartuProduk(produk) {
    const nama = escapeHTML(produk.name);
    const sku = escapeHTML(produk.sku);
    const kategori = escapeHTML(produk.category);

    const merek = escapeHTML(produk.brand);
    const varian = escapeHTML(produk.variant);
    const satuan = escapeHTML(produk.unit);

    const keterangan = [merek, varian, satuan]
        .filter(item => item && item !== "0")
        .join(" · ") || "Perlengkapan listrik";

    const harga = Number(produk.price) > 0
        ? formatRupiah(produk.price)
        : "Hubungi toko";

    const stok = getKetersediaan(produk);

    const daftarFoto = produk.images?.length
        ? produk.images
        : (produk.image ? [produk.image] : []);

    const gambar = daftarFoto.length
        ? `
            <img
                class="product-main-image"
                src="${escapeHTML(daftarFoto[0])}"
                alt="${nama}"
                loading="lazy">
        `
        : `<div class="image-placeholder">Foto produk belum tersedia</div>`;

    const thumbnail = daftarFoto.length > 1
        ? `
            <div class="product-thumbnails">
                ${daftarFoto.map((foto, index) => `
                    <button
                        type="button"
                        class="product-thumbnail ${index === 0 ? "active" : ""}"
                        data-image="${escapeHTML(foto)}"
                        aria-label="Lihat foto ${index + 1}">
                        <img
                            src="${escapeHTML(foto)}"
                            alt="${nama} foto ${index + 1}">
                    </button>
                `).join("")}
            </div>
        `
        : "";

    return `
        <article class="product-card" data-sku="${sku}">
            <div class="product-image">
                <div class="product-main-image-wrap">
                    ${gambar}
                </div>
                ${thumbnail}
            </div>

            <div class="product-info">
                <span class="product-category">${kategori}</span>

                <h3>${nama}</h3>

                <p class="product-stock">${escapeHTML(stok)}</p>

                <p class="product-price">${harga}</p>

                <a
    class="product-contact"
    href="${buatLinkWhatsApp({
        name: produk.name,
        sku: produk.sku
    })}"
    target="_blank"
    rel="noopener noreferrer">
    Tanya / Pesan
</a>
            </div>
        </article>
    `;
}


function tampilkanKategori() {
    const daftarKategori = document.getElementById("category-list");
    const filterKategori = document.getElementById("filter-category");

    const kategori = [...new Set(
        products.map(produk => produk.category).filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, "id"));

    if (daftarKategori) {
        daftarKategori.innerHTML = kategori.map((nama, index) => {
            const jumlah = products.filter(
                produk => produk.category === nama
            ).length;

            return `
                <a
                    href="produk.html?kategori=${encodeURIComponent(nama)}"
                    class="category-card"
                    data-kategori="${escapeHTML(nama)}">

                    <span class="category-number">
                        ${String(index + 1).padStart(2, "0")}
                    </span>

                    <h3>${escapeHTML(nama)}</h3>

                    <p>${jumlah} produk</p>
                </a>
            `;
        }).join("");
    }

    if (filterKategori) {
        filterKategori.innerHTML =
            '<option value="">Semua Kategori</option>' +
            kategori.map(nama => `
                <option value="${escapeHTML(nama)}">
                    ${escapeHTML(nama)}
                </option>
            `).join("");
    }
}

function tampilkanProduk() {
    const daftarProduk = document.getElementById("product-list");
    const kolomCari = document.getElementById("search-product");
    const filterKategori = document.getElementById("filter-category");

    if (!daftarProduk) return;

    const params = new URLSearchParams(window.location.search);
    const kategoriURL = params.get("kategori");

    if (filterKategori && kategoriURL) {
        const opsiValid = Array.from(filterKategori.options)
            .some(opsi => opsi.value === kategoriURL);

        if (opsiValid) {
            filterKategori.value = kategoriURL;
        }
    }

    const kataKunci = (kolomCari?.value || "").trim().toLowerCase();
    const kategoriDipilih = filterKategori?.value || "";

    const hasil = products.filter(produk => {
        const informasi = [
            produk.name,
            produk.brand,
            produk.sku,
            produk.category,
            produk.variant,
            produk.type
        ].join(" ").toLowerCase();

        const cocokPencarian = informasi.includes(kataKunci);

        const cocokKategori =
            !kategoriDipilih ||
            produk.category === kategoriDipilih;

        return cocokPencarian && cocokKategori;
    });

    if (hasil.length === 0) {
        daftarProduk.innerHTML = `
            <p class="empty-message">
                Produk tidak ditemukan.
                Coba kata kunci atau kategori lainnya.
            </p>
        `;
        return;
    }

    daftarProduk.innerHTML = hasil.map(buatKartuProduk).join("");
}

function tampilkanProdukUnggulan() {
    const daftarProduk = document.getElementById("featured-products");

    if (!daftarProduk) return;

    const produkUnggulan = products
        .filter(produk => Number(produk.price) > 0)
        .slice(0, 4);

    if (produkUnggulan.length === 0) {
        daftarProduk.innerHTML = `
            <p class="empty-message">
                Produk unggulan belum tersedia.
            </p>
        `;
        return;
    }

    daftarProduk.innerHTML = produkUnggulan
        .map(buatKartuProduk)
        .join("");
}

async function muatProduk() {
    const daftarProduk = document.getElementById("product-list");

    try {
        // Ambil data produk
        const { data, error } = await supabaseClient
            .from("produk")
            .select("*")
            .eq("aktif", true)
            .order("nama_barang", { ascending: true });

        if (error) throw error;

        // Ambil seluruh foto produk
        const { data: fotoData, error: fotoError } = await supabaseClient
            .from("produk_foto")
            .select("*")
            .order("urutan", { ascending: true });

        if (fotoError) throw fotoError;

        // Gabungkan data produk dengan foto
        products = data.map((item) => {
            const daftarFoto = fotoData
                .filter(foto => foto.produk_id === item.id)
                .map(foto => foto.gambar_url);

            return {
                id: item.id,
                sku: item.sku,
                category: item.kategori,
                jenis_barang: item.jenis_barang,
                name: item.nama_barang,
                brand: item.merk,
                variant: item.varian_toko,
                unit: item.unit,
                qty: item.qty,
                price: item.harga_jual,
                image: daftarFoto[0] || item.gambar_url,
                images: daftarFoto.length
                    ? daftarFoto
                    : (item.gambar_url ? [item.gambar_url] : [])
            };
        });

        tampilkanKategori();
        tampilkanProduk();
        tampilkanProdukUnggulan();

        console.log("Produk berhasil dimuat:", products.length);
        console.log("Foto produk berhasil dimuat:", fotoData.length);

    } catch (error) {
        console.error("Gagal memuat produk:", error);

        if (daftarProduk) {
            daftarProduk.innerHTML = `
                <p class="empty-message">
                    Produk gagal dimuat. Silakan periksa koneksi database.
                </p>
            `;
        }
    }
}
// =====================================
// LIGHTBOX - PERBESAR FOTO PRODUK
// =====================================

let lightboxImages = [];
let lightboxIndex = 0;

function buatLightbox() {
    const lightbox = document.createElement("div");

    lightbox.id = "product-lightbox";
    lightbox.innerHTML = `
        <button class="lightbox-close" aria-label="Tutup">&times;</button>

        <button class="lightbox-prev" aria-label="Foto sebelumnya">
            &#10094;
        </button>

        <img class="lightbox-image" src="" alt="Foto produk">

        <button class="lightbox-next" aria-label="Foto berikutnya">
            &#10095;
        </button>

        <div class="lightbox-counter"></div>
    `;

    document.body.appendChild(lightbox);

    lightbox.addEventListener("click", (event) => {
        if (
            event.target === lightbox ||
            event.target.closest(".lightbox-close")
        ) {
            tutupLightbox();
        }

        if (event.target.closest(".lightbox-prev")) {
            geserLightbox(-1);
        }

        if (event.target.closest(".lightbox-next")) {
            geserLightbox(1);
        }
    });

    document.addEventListener("keydown", (event) => {
        const aktif = lightbox.classList.contains("active");

        if (!aktif) return;

        if (event.key === "Escape") tutupLightbox();
        if (event.key === "ArrowLeft") geserLightbox(-1);
        if (event.key === "ArrowRight") geserLightbox(1);
    });
}

function bukaLightbox(images, index) {
    lightboxImages = images;
    lightboxIndex = index;

    perbaruiLightbox();

    document.getElementById("product-lightbox")
        .classList.add("active");

    document.body.style.overflow = "hidden";
}

function tutupLightbox() {
    document.getElementById("product-lightbox")
        .classList.remove("active");

    document.body.style.overflow = "";
}

function geserLightbox(arah) {
    lightboxIndex =
        (lightboxIndex + arah + lightboxImages.length)
        % lightboxImages.length;

    perbaruiLightbox();
}

function perbaruiLightbox() {
    const lightbox = document.getElementById("product-lightbox");

    lightbox.querySelector(".lightbox-image").src =
        lightboxImages[lightboxIndex];

    lightbox.querySelector(".lightbox-counter").textContent =
        `${lightboxIndex + 1} / ${lightboxImages.length}`;

    lightbox.querySelector(".lightbox-prev").style.display =
        lightboxImages.length > 1 ? "flex" : "none";

    lightbox.querySelector(".lightbox-next").style.display =
        lightboxImages.length > 1 ? "flex" : "none";
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("search-product")
        ?.addEventListener("input", tampilkanProduk);

    document.getElementById("filter-category")
        ?.addEventListener("change", tampilkanProduk);

    document.getElementById("reset-filter")
        ?.addEventListener("click", () => {
            const kolomCari = document.getElementById("search-product");
            const filterKategori = document.getElementById("filter-category");

            if (kolomCari) {
                kolomCari.value = "";
            }

            if (filterKategori) {
                filterKategori.value = "";
            }

            tampilkanProduk();
        });

    const tahun = document.getElementById("current-year");

    if (tahun) {
        tahun.textContent = new Date().getFullYear();
    }

    // Aktifkan lightbox
buatLightbox();

// Klik thumbnail untuk mengganti foto utama
document.addEventListener("click", (event) => {
    const thumbnail = event.target.closest(".product-thumbnail");

    if (thumbnail) {
        const kartu = thumbnail.closest(".product-card");
        const gambarUtama = kartu.querySelector(".product-main-image");

        if (!gambarUtama) return;

        gambarUtama.src = thumbnail.dataset.image;

        kartu.querySelectorAll(".product-thumbnail")
            .forEach(item => item.classList.remove("active"));

        thumbnail.classList.add("active");

        return;
    }

    // Klik foto utama untuk memperbesar
    const gambar = event.target.closest(".product-main-image");

    if (!gambar) return;

    const kartu = gambar.closest(".product-card");

    const images = Array.from(
        kartu.querySelectorAll(".product-thumbnail")
    ).map(item => item.dataset.image);

    if (images.length === 0) {
        images.push(gambar.src);
    }

    const index = Math.max(0, images.indexOf(gambar.src));

    bukaLightbox(images, index);
});

    muatProduk();
});
