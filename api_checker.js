const fs = require('fs');
const path = require('path');

const backendRoutesDir = 'D:/GIT/restaurant-pos/src/routes';
const frontendServicesDir = 'd:/GIT/restaurant-pos-frontend/src/services';

const routeRegex = /(?:router|app)\.(get|post|put|patch|delete)\s*\(\s*['"`](.*?)['"`]/g;
const serviceRegex = /(?:axios|api|fetch)\.(get|post|put|patch|delete)\s*\(\s*['"`](.*?)['"`]/g;

function getBackendEndpoints() {
    const endpoints = [];
    const files = fs.readdirSync(backendRoutesDir);
    files.forEach(file => {
        if (!file.endsWith('.js')) return;
        const content = fs.readFileSync(path.join(backendRoutesDir, file), 'utf-8');
        let match;
        while ((match = routeRegex.exec(content)) !== null) {
            const method = match[1].toUpperCase();
            let route = match[2];
            // Normalize route path, e.g. from app.use in app.js
            let baseRoute = '';
            if (file === 'authRoutes.js') baseRoute = '/auth';
            else if (file === 'userRoutes.js') baseRoute = '/users';
            else if (file === 'productRoutes.js') baseRoute = '/products';
            else if (file === 'orderRoutes.js') baseRoute = '/orders';
            else if (file === 'uploadRoutes.js') baseRoute = '/upload';
            else if (file === 'customerRoutes.js') baseRoute = '/customers';
            else if (file === 'categoryRoutes.js') baseRoute = '/categories';
            else if (file === 'modificationRoutes.js') baseRoute = '/modifications';
            else if (file === 'paymentRoutes.js') baseRoute = '/payments';
            else if (file === 'reportRoutes.js') baseRoute = '/reports';
            else if (file === 'sessionRoutes.js') baseRoute = '/sessions';
            else if (file === 'branchRoutes.js') baseRoute = '/branches';
            else if (file === 'discountRoutes.js') baseRoute = '/discounts';
            else if (file === 'dashboardRoutes.js') baseRoute = '/dashboard';
            else if (file === 'activityLogRoutes.js') baseRoute = '/activity-logs';
            else if (file === 'supplierRoutes.js') baseRoute = '/suppliers';
            else if (file === 'materialRoutes.js') baseRoute = '/materials';
            else if (file === 'stockRoutes.js') baseRoute = '/supply/stocks';
            else if (file === 'assignmentRoutes.js') baseRoute = '/supply/assignments';
            else if (file === 'cronRoutes.js') baseRoute = '/cron';
            else if (file === 'printRoutes.js') baseRoute = '/print';
            else if (file === 'deliveryChargeRoutes.js') baseRoute = '/delivery-charges';
            else if (file === 'serviceChargeRoutes.js') baseRoute = '/service-charge';
            else if (file === 'productBundleRoutes.js') baseRoute = '/product-bundles';
            else if (file === 'bogoPromotionRoutes.js') baseRoute = '/bogo-promotions';
            else if (file === 'chatbotRoutes.js') baseRoute = '/chatbot';
            else if (file === 'customerCategoryDiscountRoutes.js') baseRoute = '/customer-category-discounts';
            else if (file === 'tableRoutes.js') baseRoute = '/tables';
            else if (file === 'returnRoutes.js') baseRoute = '/returns'; // Assumed from returnRoutes.js

            if (route === '/') route = '';
            if (route.startsWith('/')) route = route.substring(1);
            
            // Replaces params like :id to just a placeholder for easier matching
            route = route.replace(/:([a-zA-Z0-9_]+)/g, ':param');

            let finalPath = `${baseRoute}/${route}`;
            if (finalPath.endsWith('/')) finalPath = finalPath.slice(0, -1);
            
            // Special handling for ReturnRoutes.js which doesn't follow naming convention
            if(file === 'ReturnRoutes.js') {
               finalPath = `/returns/${route}`;
            }

            endpoints.push({ method, path: finalPath, file });
        }
    });
    return endpoints;
}

function getFrontendBindings() {
    const bindings = [];
    const files = fs.readdirSync(frontendServicesDir);
    files.forEach(file => {
        if (!file.endsWith('.ts') && !file.endsWith('.tsx') && !file.endsWith('.js')) return;
        const content = fs.readFileSync(path.join(frontendServicesDir, file), 'utf-8');
        
        // This regex is very simple, we also need to catch template literals like `/api/users/${id}`
        const templateRegex = /(?:axios|api|fetch|apiClient|axiosInstance)\.(get|post|put|patch|delete)\s*\(\s*`([^`]+)`/g;
        const strRegex = /(?:axios|api|fetch|apiClient|axiosInstance)\.(get|post|put|patch|delete)\s*\(\s*['"]([^'"]+)['"]/g;

        let match;
        while ((match = templateRegex.exec(content)) !== null) {
            bindings.push({ method: match[1].toUpperCase(), path: match[2], file });
        }
        while ((match = strRegex.exec(content)) !== null) {
            bindings.push({ method: match[1].toUpperCase(), path: match[2], file });
        }
    });
    return bindings;
}

const backend = getBackendEndpoints();
const frontend = getFrontendBindings();

// Normalize both for comparison
const beSet = new Set(backend.map(b => `${b.method} ${b.path}`));
const feSet = new Set(frontend.map(f => {
    let p = f.path;
    // Replace ${xyz} with :param
    p = p.replace(/\$\{[^}]+\}/g, ':param');
    if (p.endsWith('/')) p = p.slice(0, -1);
    return `${f.method} ${p}`;
}));

console.log("=== Missing in Frontend ===");
backend.forEach(b => {
    const normalizedB = `${b.method} ${b.path}`;
    if (!feSet.has(normalizedB)) {
        console.log(`${normalizedB} (${b.file})`);
    }
});

console.log("\n=== Extraneous in Frontend (or unmatched) ===");
frontend.forEach(f => {
    let p = f.path;
    p = p.replace(/\$\{[^}]+\}/g, ':param');
    if (p.endsWith('/')) p = p.slice(0, -1);
    const normalizedF = `${f.method} ${p}`;
    if (!beSet.has(normalizedF)) {
        console.log(`${normalizedF} (${f.file})`);
    }
});
