import Swal from "sweetalert2";

export default function CopyButton({
    text,
    label = "COPY",
}: {
    text: string;
    label?: string;
}) {
    const onClick = async () => {
        try {
            await navigator.clipboard.writeText(text);
            Swal.fire({
                icon: "success",
                title: "Copied!",
                text: `"${text}" has been copied to clipboard.`,
                timer: 1500,
                showConfirmButton: false,
                toast: true,
                position: "top-end",
            });
        } catch {
            Swal.fire({
                icon: "error",
                title: "Copy Failed",
                text: "Could not copy to clipboard. Please try again.",
                confirmButtonColor: "#dc2626",
            });
        }
    };

    return (
        <button
            onClick={onClick}
            className="px-3 py-2  rounded border border-blue-500 text-blue-500 cursor-pointer hover:bg-blue-500 hover:text-white transition"
        >
            {label}
        </button>
    );
}
