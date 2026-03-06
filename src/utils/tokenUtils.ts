const tokenUtils = {
    generateToken: (length: number) => {
        const uint8arr = crypto.getRandomValues(new Uint8Array(length));
        const base64 = btoa(String.fromCharCode(...uint8arr));
        const base64url = base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        return base64url.slice(0, length) //base64 generates 1 extra char for every 3 bytes
    }
}

export default tokenUtils;