import React, { useRef, useState } from "react";
import html2pdf from "html2pdf.js";

export default function ShoppingList() {
    const pdfRef = useRef();

    const downloadPDF = () => {
        const element = pdfRef.current;

        const options = {
            margin: 0.5,
            filename: "indkøbsliste.pdf",
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
        };

        html2pdf().set(options).from(element).save();

    };

    const [items, setItems] = useState([
        {
            id: 1,
            shop: "Rema",
            name: "Tomater",
            qty: "3 Store",
            tag: "Caprese Salad",
            checked: false,
        },
        {
            id: 2,
            shop: "Rema",
            name: "Ruccola",
            qty: "200 G",
            tag: "Steak Frites",
            checked: false,
        },
        {
            id: 3,
            shop: "Rema",
            name: "Frisk Thai Basillikum",
            qty: "1 Håndfuld",
            tag: "Curry Night",
            checked: false,
        },
        {
            id: 4,
            shop: "Netto",
            name: "Ribeye Steak",
            qty: "400 G TOTAL",
            tag: "Friday Dinner",
            checked: false,
        },
    ]);

    const toggleItem = (id) => {
        setItems((prev) =>
            prev.map((item) =>
                item.id === id
                    ? { ...item, checked: !item.checked }
                    : item
            )
        );
    };
    const remaCount = items.filter((i) => i.shop === "Rema").length;


    const totalItems = items.length;

    const missingItems = items.filter((item) => !item.checked); // ARRAY
    const missingCount = missingItems.length;                  // TAL



    return (
        <main className="flex-grow max-w-7xl mx-auto w-full px-8 py-12">
            {/* Header Section */}
            <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="max-w-2xl">
                    <div className="inline-flex items-center px-4 py-1.5 mb-4 rounded-full bg-primary-container text-on-primary-container text-xs font-bold tracking-widest uppercase">
                        Ugens madplan
                    </div>
                    <h1 className="text-5xl font-extrabold tracking-tighter text-on-surface mb-4">
                        Indkøbsliste
                    </h1>
                    <p className="text-lg text-on-surface-variant leading-relaxed">
                        Baseret på din{" "}
                        <span className="font-semibold text-primary">
                            Madplan
                        </span>
                        . Varene er baseret på din indkøbsliste og gængse husholdningsprodukter.
                    </p>
                </div>

                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-8 py-4 rounded-full bg-surface-container-high text-on-surface font-semibold hover:bg-surface-dim transition-all scale-95 active:opacity-80" onClick={downloadPDF}>
                        <span className="material-symbols-outlined">print</span>
                        Print til PDF
                    </button>
                    {/* Export segment - Laves muligvis 
                    <button className="flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-primary to-primary-dim text-on-primary font-bold shadow-xl shadow-primary/10 hover:primary-fixed-dim transition-all scale-95 active:opacity-80">
                        <span className="material-symbols-outlined">ios_share</span>
                        Export
                    </button>
                     */}
                </div>

            </header>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Rema */}
                    <section className="bg-surface-container-low rounded-xl p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-surface-container-lowest flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary">
                                        restaurant
                                    </span>
                                </div>
                                <h2 className="text-2xl font-bold tracking-tight">
                                    Rema
                                </h2>
                            </div>

                            <span className="text-sm font-bold text-on-surface-variant tracking-widest uppercase">
                                {items.filter((i) => i.shop === "Rema").length} VARER
                            </span>

                        </div>
                        {items
                            .filter((item) => item.shop === "Rema")
                            .map((item) => (
                                <label
                                    key={item.id}
                                    className="group flex items-center justify-between p-4 bg-surface-container-lowest rounded-DEFAULT hover:shadow-sm transition-all cursor-pointer"
                                >
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="checkbox"
                                            checked={item.checked}
                                            onChange={() => toggleItem(item.id)}
                                            className="w-6 h-6 rounded border-none bg-surface-container-high text-primary focus:ring-primary/20"
                                        />
                                        <div className={item.checked ? "line-through opacity-50" : ""}>
                                            <p className="font-semibold text-on-surface">
                                                {item.name}
                                            </p>
                                            <p className="text-xs font-bold text-on-surface-variant tracking-wider uppercase">
                                                {item.qty}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-on-surface-variant bg-surface-container-low px-3 py-1 rounded-full">
                                        {item.tag}
                                    </span>
                                </label>
                            ))}
                    </section>


                    {/* Shop2 */}
                    <section className="bg-surface-container-low rounded-xl p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-surface-container-lowest flex items-center justify-center">
                                    <span className="material-symbols-outlined text-secondary">
                                        restaurant
                                    </span>
                                </div>
                                <h2 className="text-2xl font-bold tracking-tight">
                                    Netto
                                </h2>
                            </div>
                            <span className="text-sm font-bold text-on-surface-variant tracking-widest uppercase">
                                {items.filter((i) => i.shop === "Netto").length}
                            </span>
                        </div>

                        {items
                            .filter((item) => item.shop === "Netto")
                            .map((item) => (
                                <label
                                    key={item.id}
                                    className="group flex items-center justify-between p-4 bg-surface-container-lowest rounded-DEFAULT hover:shadow-sm transition-all cursor-pointer"
                                >
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="checkbox"
                                            checked={item.checked}
                                            onChange={() => toggleItem(item.id)}
                                            className="w-6 h-6 rounded border-none bg-surface-container-high text-primary focus:ring-primary/20"
                                        />
                                        <div className={item.checked ? "line-through opacity-50" : ""}>
                                            <p className="font-semibold text-on-surface">
                                                {item.name}
                                            </p>
                                            <p className="text-xs font-bold text-on-surface-variant tracking-wider uppercase">
                                                {item.qty}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-on-surface-variant bg-surface-container-low px-3 py-1 rounded-full">
                                        {item.tag}
                                    </span>
                                </label>
                            ))}
                    </section>


                </div>

                {/* Right */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Summary */}
                    <div className="bg-surface-container-highest rounded-lg p-8">
                        <h3 className="text-xl font-bold mb-6">Resumé</h3>
                        <div className="space-y-6">

                            <div className="flex justify-between">
                                <span>Antal varer</span>
                                <span className="font-bold">{totalItems}</span>
                            </div>

                            <div className="flex justify-between text-primary">
                                <span>Manglende</span>
                                <span className="font-bold">{missingCount}</span>
                            </div>

                            <div className="h-px bg-outline-variant/30"></div>
                            <div>
                                <p className="text-xs font-bold uppercase">
                                    Estimeret total
                                </p>
                                <p className="text-3xl font-extrabold">159.00 kr.-</p>
                            </div>
                        </div>
                    </div>

                    {/* Image */}
                    <div className="relative overflow-hidden rounded-lg aspect-[4/5] bg-surface-dim">
                        <img
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAW1zzhLKReSGqjlOGz94QPQQv_JmT7oXp-zSKLv0iFa2xuf7ZGm5kfoZCWdKYlBq7VUTh1nilgCpNr8q7iTwvt7lSYA01x2y2vrt_ARa5cf7rz1M3k5kxYDcq-UhfuBBjmcpdb3c2t_2eriv-tD4LVVBK5OvvHjssIL7e9hk0ABRotkuTSMg-YKe0peVte7wsdnzuMQZuh_3gUSQe7s_BqEzQm4mnjil5XP384nt98_J8nNflVOSEirY0Zv_vkRnv47vBR8Llrq49V"
                            alt="Fresh market produce"
                            className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-80"
                        />
                    </div>
                </div>
            </div>

            {/* Printing missing items to pdf - HIDDEN IN PRODUCTION */}


            <div style={{ display: "none" }}>
                <div
                    ref={pdfRef}
                    className="pdf-layout p-8 font-sans text-on-surface bg-white"
                >
                    <h1 className="text-3xl font-extrabold mb-6">
                        Indkøbsliste – Manglende varer
                    </h1>

                    {["Rema", "Netto"].map(shop => {
                        const shopItems = missingItems.filter(i => i.shop === shop);
                        if (shopItems.length === 0) return null;

                        return (
                            <section key={shop} className="mb-8">
                                <h2 className="text-xl font-bold mb-3">
                                    {shop}
                                </h2>

                                <ul className="space-y-2">
                                    {shopItems.map(item => (
                                        <li
                                            key={item.id}
                                            className="flex justify-between p-3 border rounded-lg"
                                        >
                                            <span className="font-semibold">
                                                {item.name}
                                            </span>
                                            <span className="text-sm text-gray-600">
                                                {item.qty}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        );
                    })}
                </div>
            </div>


        </main>
    )
}
