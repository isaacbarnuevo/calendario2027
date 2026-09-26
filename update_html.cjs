const fs = require('fs');

const appJsx = fs.readFileSync('src/App.jsx', 'utf8');

// Extract the logic after imports
const logicStart = appJsx.indexOf('const QUOTAS_INITIAL');
let logic = appJsx.substring(logicStart);

// Remove "export default " from the App function
logic = logic.replace('export default function App()', 'function App()');

// Prepare the HTML shell
const htmlShell = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Planificador: El Escudo de Invierno 2027</title>
    
    <!-- React & ReactDOM (Umd) -->
    <script src="https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js" crossorigin></script>
    <script src="https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
    
    <!-- Lucide React (Umd) -->
    <script src="https://cdn.jsdelivr.net/npm/lucide-react/dist/umd/lucide-react.js"></script>
    
    <!-- Babel (Stand-alone) -->
    <script src="https://cdn.jsdelivr.net/npm/@babel/standalone/babel.min.js"></script>
    
    <!-- Tailwind CSS (Play CDN) -->
    <script src="https://cdn.tailwindcss.com"></script>

    <style>
        body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif; }
        .loading-screen { display: flex; align-items: center; justify-content: center; height: 100vh; background: #f1f5f9; }
    </style>
</head>
<body class="bg-slate-100">
    <div id="root">
        <div class="loading-screen">
            <div class="text-center">
                <h2 class="text-2xl font-bold text-slate-800 animate-pulse">Cargando Planificador...</h2>
                <p class="text-slate-500 mt-2">Transformando calendarios para 2027</p>
            </div>
        </div>
    </div>

    <script type="text/babel">
        const { useState, useMemo, useEffect } = React;
        const Lucide = window.LucideReact || {};

        const { 
            Calendar = () => null, 
            AlertTriangle = () => null, 
            Info = () => null, 
            RefreshCw = () => null, 
            Calculator = () => null, 
            LayoutGrid = () => null, 
            PlaneTakeoff = () => null, 
            Settings = () => null, 
            Flame = () => null, 
            Zap = () => null, 
            Users = () => null 
        } = Lucide;

        // --- Extracted from App.jsx ---
        ${logic}
        // ------------------------------

        const container = document.getElementById('root');
        const root = ReactDOM.createRoot(container);
        root.render(<App />);
    </script>
</body>
</html>`;

fs.writeFileSync('calendario27_pro.html', htmlShell);
console.log('Successfully updated calendario27_pro.html');
