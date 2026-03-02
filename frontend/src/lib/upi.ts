export function providerUri(
    method: string,
    upiLink: string | undefined,
    vpa: string,
    amount: number
): string {
    // Base UPI parameters
    const params = new URLSearchParams({
        pa: vpa,
        pn: "Merchant", // Assuming a generic merchant name
        am: String(amount),
        cu: "INR",
    });

    // Determine the base URI scheme for the selected app
    let baseUri: string;
    switch (method) {
        case "PhonePe":
            baseUri = "phonepe://pay";
            break;
        case "Paytm":
            baseUri = "paytmmp://pay";
            break;
        case "Google Pay":
            baseUri = "tez://upi/pay";
            break;
        default:
            // For the generic "upi" method, prioritize the backend link if available
            if (upiLink) {
                return upiLink;
            }
            // Otherwise, construct a standard UPI link
            baseUri = "upi://pay";
            break;
    }

    // Combine base URI and parameters
    return `${baseUri}?${params.toString()}`;
}
