function init() {
    const toast = document.getElementById('toast');
    toast.classList.remove('hidden');
    function wait(ms) {
        return new Promise((resolve) => {
            setTimeout(() => {
                toast.classList.add('hidden');
                resolve();
            }, ms);
        });
    }
    async function executar() {
        await wait(3000);
        window.location.href = "/home/";
    }
    executar();
};

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}

window.useSystemTheme;