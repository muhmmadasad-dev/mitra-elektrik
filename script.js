const WHATSAPP_NUMBER = "6282240000226";

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

    const gambar = produk.image
        ? `<img src="${escapeHTML(produk.image)}" alt="${nama}" loading="lazy">`
        : `<div class="image-placeholder">Foto produk belum tersedia</div>`;

    return `
        <article class="product-card" data-sku="${sku}">
            <div class="product-image">
                ${gambar}
            </div>

            <div class="product-info">
                <span class="product-category">${kategori}</span>

                <h3>${nama}</h3>

                <p class="product-description">
                    ${escapeHTML(keterangan)}
                </p>

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
                    Tanya / Pesan via WhatsApp
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
        const respons = await fetch("products.json");

        if (!respons.ok) {
            throw new Error("File products.json tidak ditemukan.");
        }

        const data = await respons.json();

        if (!Array.isArray(data)) {
            throw new Error("Format products.json tidak sesuai.");
        }

        products = data;

        tampilkanKategori();
        tampilkanProduk();
        tampilkanProdukUnggulan();

    } catch (error) {
        console.error("Gagal memuat produk:", error);

        if (daftarProduk) {
            daftarProduk.innerHTML = `
                <p class="empty-message">
                    Data produk belum berhasil dimuat.
                    Pastikan file products.json berada
                    satu folder dengan index.html.
                    Jalankan website menggunakan Live Server.
                </p>
            `;
        }

        const daftarUnggulan =
            document.getElementById("featured-products");

        if (daftarUnggulan) {
            daftarUnggulan.innerHTML = `
                <p class="empty-message">
                    Produk belum berhasil dimuat.
                </p>
            `;
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("search-product")
        ?.addEventListener("input", tampilkanProduk);

    document.getElementById("filter-category")
        ?.addEventListener("change", tampilkanProduk);

    const tahun = document.getElementById("current-year");

    if (tahun) {
        tahun.textContent = new Date().getFullYear();
    }

    muatProduk();
});
