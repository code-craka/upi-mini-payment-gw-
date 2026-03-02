import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Swal from "sweetalert2";
import CopyButton from "../components/CopyButton";
import { providerUri } from "../lib/upi";
import type { OrderPublic } from "../types/types";

// icons
import googlePay from "../assets/icons/googlepay.png";
import payTm from "../assets/icons/paytm.svg";
import phonePay from "../assets/icons/phonepay.svg";
import upi from "../assets/icons/upi.webp";

const methods = [
    { name: "phonepay", icon: phonePay },
    { name: "paytm", icon: payTm },
    { name: "googlepay", icon: googlePay },
    { name: "upi", icon: upi },
];

export default function PayPage() {
    const { orderId } = useParams<{ orderId: string }>();
    const [order, setOrder] = useState<OrderPublic | null>(null);
    const [utr, setUtr] = useState("");
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(10 * 60); // display-only timer

    const api = import.meta.env.VITE_API_URL;

    // Fetch order details
    useEffect(() => {
        const fetchOrder = async () => {
            if (!orderId) return;
            try {
                const r = await axios.get<OrderPublic>(
                    `${api}/api/orders/${orderId}`
                );
                setOrder(r.data);
            } catch (err) {
                if (axios.isAxiosError(err)) {
                    Swal.fire({
                        icon: "error",
                        title: "Error",
                        text:
                            err.response?.data?.message ||
                            "Error fetching order",
                        confirmButtonColor: "#2563eb",
                    });
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Unknown Error",
                        text: "Something went wrong while fetching order details.",
                        confirmButtonColor: "#2563eb",
                    });
                }
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [orderId, api]);

    // Countdown timer (only display)
    useEffect(() => {
        if (timeLeft <= 0) return;
        const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    if (loading) return <div className="text-center py-10">Loading…</div>;
    if (!order) return <div className="text-center py-10">Order not found</div>;

    // Safely parse the full VPA from the UPI link
    const fullVpa = (() => {
        if (order.upiLink) {
            try {
                const url = new URL(order.upiLink);
                return url.searchParams.get("pa") || "";
            } catch (e) {
                console.error("Could not parse UPI link:", order.upiLink, e);
            }
        }
        return order.maskedVpa.replace(/\*+/g, "");
    })();

    const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
    const seconds = String(timeLeft % 60).padStart(2, "0");

    const onPay = (method: string) => {
        if (!order?.upiLink) {
            Swal.fire({
                icon: "warning",
                title: "UPI Link Missing",
                text: "UPI link not available for this order.",
                confirmButtonColor: "#2563eb",
            });
            return;
        }
        const uri = providerUri(
            method,
            order.upiLink,
            order.maskedVpa.replace(/\*+/g, ""),
            order.amount
        );

        window.location.href = uri;
    };

    const submitUtr = async () => {
        if (!orderId) return;
        if (!utr.trim()) {
            Swal.fire({
                icon: "warning",
                title: "Missing UTR",
                text: "Please enter a valid UTR number before submitting.",
                confirmButtonColor: "#2563eb",
            });
            return;
        }
        try {
            await axios.post(`${api}/api/orders/${orderId}/utr`, { utr });
            Swal.fire({
                icon: "success",
                title: "UTR Submitted",
                text: "Your payment UTR has been submitted successfully.",
                confirmButtonColor: "#2563eb",
            });
            setUtr("");
        } catch (err) {
            if (axios.isAxiosError(err)) {
                Swal.fire({
                    icon: "error",
                    title: "Submission Failed",
                    text: err.response?.data?.message || "Error submitting UTR",
                    confirmButtonColor: "#dc2626",
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Unknown Error",
                    text: "Something went wrong while submitting UTR.",
                    confirmButtonColor: "#dc2626",
                });
            }
        }
    };

    return (
<div className="max-w-lg mx-auto bg-white rounded-xl shadow-lg p-6 space-y-6">
            {/* Header with Timer */}
    <div className="flex items-center justify-between pb-4 border-b">
        <p className="text-gray-600">Order expires in:</p>
        <p className="text-2xl font-mono text-red-500 bg-red-100 px-3 py-1 rounded">
                    {minutes}:{seconds}
                </p>
            </div>

    {/* Amount Section */}
            <div className="flex items-center justify-between">
        <p className="text-gray-600">Amount to Pay</p>
                <div className="flex items-center gap-3">
            <p className="text-2xl font-bold text-gray-900">
                        ₹ {order.amount}
                    </p>
                    <CopyButton text={String(order.amount)} label="COPY" />
                </div>
            </div>

            {/* VPA Section */}
    <div className="flex items-center justify-between">
        <p className="text-gray-600">UPI Address</p>
                <div className="flex items-center gap-3">
            <p className="font-mono text-lg bg-gray-100 px-2 py-1 rounded">{order.maskedVpa}</p>
                    <CopyButton text={fullVpa} label="COPY" />
                </div>
            </div>

            {/* Payment Methods */}
    <div>
        <p className="text-center text-gray-600 mb-4">
            Choose a payment method
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {methods.map((m) => (
                <div
                    key={m.name}
                    onClick={() => onPay(m.name)}
                    className="flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer hover:bg-gray-100 hover:shadow-md transition-all"
                >
                    <img
                        src={m.icon}
                        alt={m.name}
                        className="w-12 h-12 mb-2"
                    />
                    <span className="text-sm capitalize">{m.name}</span>
                </div>
            ))}
        </div>
            </div>

            {/* UTR Input */}
    <div className="pt-4 border-t">
        <label className="block mb-2 font-semibold text-gray-700">
            Enter UTR after payment
                </label>
        <div className="flex gap-2">
            <input
                className="flex-grow p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="UTR / Transaction ID"
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
            />
            <button
                onClick={submitUtr}
                className="bg-blue-600 text-white rounded-md px-6 py-3 font-semibold hover:bg-blue-700 transition-colors"
            >
                Submit
            </button>
        </div>
            </div>

            {/* Notice */}
    <p className="text-xs text-red-600 bg-red-50 p-3 rounded-md mt-4">
        <strong>Important:</strong> Only transfer from one UPI account. Do not
        change the payment amount, or the order will not be processed.
            </p>
        </div>
    );
}
