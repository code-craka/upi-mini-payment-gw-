import axios from "axios";
import React, { useState } from "react";
import Swal from "sweetalert2";
import type { CreateOrderResp } from "../types/types";

export default function PaymentGenerator() {
    const [amount, setAmount] = useState<number | "">("");
    const [vpa, setVpa] = useState("");
    const [merchantName, setMerchantName] = useState("My Business");
    const [result, setResult] = useState<CreateOrderResp | null>(null);
    const [loading, setLoading] = useState(false);

    const api = import.meta.env.VITE_API_URL || "https://api.negoman.com";

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const token = localStorage.getItem("token");
        if (!token) {
            Swal.fire({
                icon: "warning",
                title: "Login Required",
                text: "Please login to generate a payment link.",
            });
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post<CreateOrderResp>(
                `${api}/api/orders`,
                {
                    amount,
                    vpa,
                    merchantName,
                    note: "Order",
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setResult(response.data);

            Swal.fire({
                icon: "success",
                title: "Payment Link Generated",
                text: `Order ID: ${response.data.orderId}`,
            });
        } catch (err) {
            if (axios.isAxiosError(err)) {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: err.response?.data?.message || err.message,
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Unexpected Error",
                    text: "Something went wrong.",
                });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-lg mx-auto p-6 bg-white rounded-xl shadow">
            <h2 className="text-xl font-semibold mb-4">
                Payment Link Generator
            </h2>
            <form onSubmit={submit} className="space-y-4">
                <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={amount}
                    onChange={(e) =>
                        setAmount(e.target.value ? Number(e.target.value) : "")
                    }
                    placeholder="Amount (₹)"
                    className="w-full p-3 border rounded"
                />
                <input
                    value={vpa}
                    onChange={(e) => setVpa(e.target.value)}
                    placeholder="UPI ID e.g. myshop@upi"
                    className="w-full p-3 border rounded"
                />
                <input
                    value={merchantName}
                    onChange={(e) => setMerchantName(e.target.value)}
                    placeholder="Merchant name"
                    className="w-full p-3 border rounded"
                />
                <div className="flex gap-3">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-blue-600 text-white py-3 rounded"
                    >
                        {loading ? "Generating..." : "Generate Link"}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setAmount("");
                            setVpa("");
                            setResult(null);
                        }}
                        className="flex-1 bg-gray-600 text-white py-3 rounded"
                    >
                        Reset
                    </button>
                </div>
            </form>

            {result && (
                <div className="mt-4 p-4 border rounded">
                    <div>
                        Order ID: <strong>{result.orderId}</strong>
                    </div>
                    <div className="mt-2">
                        <a
                            href={result.payPageUrl}
                            target="_blank"
                            className="text-blue-600 underline"
                        >
                            {result.payPageUrl}
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
