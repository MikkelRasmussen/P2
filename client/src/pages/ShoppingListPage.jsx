import React, { useRef, useState, useEffect } from "react";
import html2pdf from "html2pdf.js";
import { useRecipes } from "../context/RecipeContext.jsx";
import {
    fetchPriceList,
    buildShoppingListFromPrices,
} from "../services/shoppingList.js";

export default function ShoppingList() {
    const pdfRef = useRef();
    const { liked } = useRecipes();

    const [priceList, setPriceList] = useState([]);
    const [items, setItems] = useState([]);
    const [missingPriceItems, setMissingPriceItems] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        fetchPriceList()
            .then((data) => setPriceList(data))
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        const { items: built, missing } = buildShoppingListFromPrices(priceList, liked);
        setItems((prev) => {
            const checkedById = Object.fromEntries(
                prev.filter((item) => item.checked).map((item) => [item.id, true])
            );
            return built.map((item) => ({
                ...item,
                checked: !!checkedById[item.id],
            }));
        });
        setMissingPriceItems(missing);
    }, [priceList, liked]);

    const downloadPDF = () => {
        html2pdf().from(pdfRef.current).save();
    };

    const toggleItem = (id) => {
        setItems((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, checked: !item.checked } : item
            )
        );
    };

    const grouped = items.reduce((acc, item) => {
        if (!acc[item.store]) acc[item.store] = [];
        acc[item.store].push(item);
        return acc;
    }, {});

    const totalItems = items.length;
    const missingItems = items.filter((i) => !i.checked);
    const missingCount = missingItems.length;

    const totalEstimated = items.reduce(
        (sum, item) => sum + item.totalCost,
        0
    );

    return (
        <main className="flex-grow max-w-7xl mx-auto w-full px-8 py-12">
            <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="max-w-2xl">
                    <h1 className="text-5xl font-extrabold tracking-tighter">
                        Indkøbsliste
                    </h1>
                </div>

                <button
                    onClick={downloadPDF}
                    className="flex items-center gap-2 px-8 py-4 rounded-full bg-surface-container-high"
                >
                    Print til PDF
                </button>
            </header>

            {loading && (
                <p className="text-gray-500 mb-8">Henter priser...</p>
            )}

            {!loading && liked.length === 0 && (
                <p className="text-gray-500">Gem nogle opskrifter først for at se indkøbslisten.</p>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-8">
                    {Object.entries(grouped).map(([store, storeItems]) => (
                        <section
                            key={store}
                            className="bg-surface-container-low rounded-xl p-8"
                        >
                            <div className="flex justify-between mb-6">
                                <h2 className="text-2xl font-bold capitalize">
                                    {store}
                                </h2>
                                <span className="text-sm font-bold uppercase">
                                    {storeItems.length} VARER
                                </span>
                            </div>

                            {storeItems.map((item) => (
                                <label
                                    key={item.id}
                                    className="group flex items-center justify-between p-4 bg-surface-container-lowest rounded cursor-pointer mb-2"
                                >
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="checkbox"
                                            checked={item.checked}
                                            onChange={() => toggleItem(item.id)}
                                            className="w-6 h-6"
                                        />
                                        <div
                                            className={
                                                item.checked
                                                    ? "line-through opacity-50"
                                                    : ""
                                            }
                                        >
                                            <p className="font-semibold">{item.name}</p>
                                            <p className="text-xs uppercase">{item.measure}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs">
                                        {item.totalCost.toFixed(2)} kr
                                    </span>
                                </label>
                            ))}

                            <div className="font-bold mt-4">
                                Total:{" "}
                                {storeItems
                                    .reduce((sum, i) => sum + i.totalCost, 0)
                                    .toFixed(2)}{" "}
                                kr
                            </div>
                        </section>
                    ))}

                    {missingPriceItems.length > 0 && (
                        <section className="bg-surface-container-low rounded-xl p-8 border border-red-300">
                            <div className="flex justify-between mb-6">
                                <h2 className="text-2xl font-bold text-red-600">
                                    Mangler priser
                                </h2>
                                <span className="text-sm font-bold uppercase">
                                    {missingPriceItems.length} VARER
                                </span>
                            </div>

                            {missingPriceItems.map((item, index) => (
                                <div
                                    key={index}
                                    className="p-4 bg-surface-container-lowest rounded mb-2 border border-red-200"
                                >
                                    <p className="font-semibold text-red-700">
                                        {item.ingredient}
                                    </p>
                                    <p className="text-xs uppercase text-red-500">
                                        {item.measure}
                                    </p>
                                </div>
                            ))}
                        </section>
                    )}
                </div>

                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-surface-container-highest rounded-lg p-8">
                        <h3 className="text-xl font-bold mb-6">Resumé</h3>

                        <div className="flex justify-between">
                            <span>Antal varer</span>
                            <span>{totalItems}</span>
                        </div>

                        <div className="flex justify-between text-primary">
                            <span>Ikke afkrydset</span>
                            <span>{missingCount}</span>
                        </div>

                        <div className="mt-6">
                            <p className="text-3xl font-extrabold">
                                {totalEstimated.toFixed(2)} kr
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: "none" }}>
                <div ref={pdfRef} className="p-6 bg-white">
                    <h1>Indkøbsliste</h1>
                    {Object.entries(grouped).map(([store, storeItems]) => (
                        <div key={store}>
                            <h2>{store}</h2>
                            <ul>
                                {storeItems.map((item, i) => (
                                    <li key={i}>
                                        {item.name} – {item.measure}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                    {missingPriceItems.length > 0 && (
                        <>
                            <h2>Mangler priser</h2>
                            <ul>
                                {missingPriceItems.map((item, i) => (
                                    <li key={i}>
                                        {item.ingredient} – {item.measure}
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                    <h3>Total: {totalEstimated.toFixed(2)} kr</h3>
                </div>
            </div>
        </main>
    );
}
