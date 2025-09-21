import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Swal from "sweetalert2";
import CopyButton from "../components/CopyButton";
import { providerUri } from "../lib/upi";
import type { OrderPublic } from "../types/types";

// icons
import { BsArrowDown } from "react-icons/bs";
import googlePay from "../assets/icons/googlepay.png";
import payTm from "../assets/icons/paytm.svg";
import phonePay from "../assets/icons/phonepay.svg";
import upi from "../assets/icons/upi.webp";

const methods = [
    { name: "PhonePe", icon: phonePay },
    { name: "Paytm", icon: payTm },
    { name: "Google Pay", icon: googlePay },
    { name: "upi", icon: upi },
];

export default function PayPage() {
    const { orderId } = useParams<{ orderId: string }>();
    const [order, setOrder] = useState<OrderPublic | null>(null);
    const [utr, setUtr] = useState("");
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(10 * 60); // display-only timer

    const api = import.meta.env.VITE_API_URL || "https://api.negoman.com";

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
        <div className="max-w-lg w-full mx-auto space-y-4 rounded-xl p-4">
            {/* Timer Header */}
            <div className="flex justify-between items-center">
                <p className="text-gray-600 text-sm">
                    Order will be closed in:
                </p>
                <p className="text-xl font-mono ">
                    <span className="bg-blue-600 text-sm p-1 rounded text-white">
                        {minutes}
                    </span>
                    <span className="text-blue-600">:</span>
                    <span className="bg-blue-600 text-sm p-1 rounded text-white">
                        {seconds}
                    </span>
                </p>
            </div>

            {/* Amount */}
            <div className="flex justify-between items-center">
                <p className="text-gray-600 text-sm">Amount</p>
                <div className="flex items-center gap-3">
                    <p className="text-lg font-bold text-gray-900">
                        ₹ {order.amount}
                    </p>
                    <CopyButton text={String(order.amount)} label="COPY" />
                </div>
            </div>

            {/* VPA/UPI */}
            <div className="flex justify-between items-center">
                <p className="text-gray-600 text-sm">VPA/UPI</p>
                <div className="flex items-center gap-3">
                    <p className="font-mono font-bold text-lg">
                        {order.maskedVpa}
                    </p>
                    <CopyButton text={fullVpa} label="COPY" />
                </div>
            </div>

            {/* Notice */}
            <div className="mt-2">
                <p className="text-red-600 font-bold text-sm">Notice</p>
                <p className="text-xs ">
                    1. <span className="text-red-600">One UPI</span> can only
                    transfer money <span className="text-red-600">once</span>.
                    <br />
                    2. Don’t change the{" "}
                    <span className=" text-red-600">payment amount</span>.
                    Otherwise, the order cannot be closed.
                </p>
            </div>

            {/* Payment Methods with radio buttons */}
            <div className="flex flex-col mb-6 border-y border-gray-200 divide-y divide-gray-200">
                {methods.map((m) => (
                    <label
                        key={m.name}
                        className="flex items-center gap-3 p-2 cursor-pointer hover:bg-blue-50"
                    >
                        <input
                            type="radio"
                            name="paymentMethod"
                            className="w-5 h-5 accent-blue-600 rounded-full"
                            onClick={() => onPay(m.name)}
                        />
                        <img
                            src={m.icon}
                            alt={m.name}
                            className="w-24 h-12 ml-4 object-contain"
                        />
                    </label>
                ))}
            </div>

            {/* UTR Input */}
            <div className="mb-6">
                <label className="flex gap-1 items-center mb-2 text-blue-700 text-sm">
                    <BsArrowDown /> Fill the UTR number after you complete
                    payment:
                </label>
                <input
                    className="w-full p-3 focus:outline-none mb-3 "
                    placeholder="Enter UTR number"
                    value={utr}
                    onChange={(e) => setUtr(e.target.value)}
                />
                <button
                    onClick={submitUtr}
                    className="w-full bg-blue-600 text-white rounded-full p-3 font-semibold hover:bg-blue-700"
                >
                    Submit UTR
                </button>
            </div>
        </div>
    );
}
