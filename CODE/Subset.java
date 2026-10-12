import java.io.*;
import java.util.*;

public class Subset {
    static final BufferedReader IN = new BufferedReader(new InputStreamReader(System.in));
    static Catalog catalog = Catalog.base();
    static final List<Integer> cart = new ArrayList<>();

    public static void main(String[] args) {
        System.out.println("\n=== AMAZON CART OPTIMIZER (SOS DP) ===");
        while (true) {
            System.out.println("\nMODE: " + catalog.label + " | CART: " + cartSummary());
            System.out.println("[1] Browse Catalog  [2] Build Cart  [3] Select All  [4] Run Optimizer  [0] Exit");
            int ch = readInt("Choose > ", 0, 4);
            if (ch == 0) break;
            switch (ch) {
                case 1 -> browseCatalog();
                case 2 -> buildCart();
                case 3 -> selectAll();
                case 4 -> runOptimizer();
            }
        }
        System.out.println("Goodbye!");
    }

    static String cartSummary() {
        if (cart.isEmpty()) return "(empty)";
        StringBuilder sb = new StringBuilder();
        for (int idx : cart) sb.append(catalog.products[idx].name).append(", ");
        return cart.size() + " items (" + sb.substring(0, sb.length() - 2) + ")";
    }

    static void browseCatalog() {
        System.out.println("\n--- PRODUCTS ---");
        for (int i = 0; i < catalog.products.length; i++) {
            Product p = catalog.products[i];
            System.out.printf("%2d. %-15s ₹%-6d (MRP ₹%d)%n", i + 1, p.name, p.price, p.mrp);
        }
        System.out.println("\n--- BUNDLES ---");
        for (Offer o : catalog.offers)
            System.out.printf("%-25s ₹%-6d%n", o.name, o.price);
    }

    static void buildCart() {
        System.out.print("Enter item numbers separated by space (e.g., 1 2 5): ");
        String line = readLine();
        if (line == null || line.isBlank()) return;
        cart.clear();
        for (String tok : line.trim().split("\\s+")) {
            try {
                int v = Integer.parseInt(tok) - 1;
                if (v >= 0 && v < catalog.products.length && !cart.contains(v)) cart.add(v);
            } catch (NumberFormatException ignored) {}
        }
        Collections.sort(cart);
        System.out.println("Cart updated!");
    }

    static void selectAll() {
        cart.clear();
        for (int i = 0; i < catalog.products.length; i++) cart.add(i);
        System.out.println("Added all items to cart.");
    }

    static void runOptimizer() {
        if (cart.isEmpty()) { System.out.println("Cart is empty!"); return; }
        long t0 = System.nanoTime();
        
        SOSEngine eng = SOSEngine.forCart(catalog, cart);
        eng.buildSumSingles();
        eng.buildFitTable();
        long optPrice = eng.runPartitionDP();
        
        long mrpTotal = 0, singlesTotal = 0;
        for (int idx : cart) {
            mrpTotal += catalog.products[idx].mrp;
            singlesTotal += catalog.products[idx].price;
        }

        double ms = (System.nanoTime() - t0) / 1e6;

        System.out.println("\n=== OPTIMIZATION RECEIPT ===");
        System.out.println("Sub-carts Evaluated : " + (1 << cart.size()));
        System.out.printf("MRP Total           : ₹%d%n", mrpTotal);
        System.out.printf("Singles Total       : ₹%d%n", singlesTotal);
        System.out.printf("SOS Optimized Total : ₹%d%n", optPrice);
        System.out.printf("Total Savings       : ₹%d (%.1f%%)%n", (mrpTotal - optPrice), (100.0 * (mrpTotal - optPrice) / mrpTotal));
        System.out.printf("Execution Time      : %.2f ms%n", ms);
    }

    static int readInt(String prompt, int min, int max) {
        while (true) {
            System.out.print(prompt);
            try {
                int v = Integer.parseInt(IN.readLine().trim());
                if (v >= min && v <= max) return v;
            } catch (Exception ignored) {}
            System.out.println("Invalid input.");
        }
    }

    static String readLine() {
        try { return IN.readLine(); } catch (Exception e) { return ""; }
    }
}

class Product {
    final String name, category; final long mrp, price;
    Product(String name, String category, long mrp, long price) {
        this.name = name; this.category = category; this.mrp = mrp; this.price = price;
    }
}

class Offer {
    final String name; final int mask; final long price;
    Offer(String name, int mask, long price) { this.name = name; this.mask = mask; this.price = price; }
}

class Catalog {
    final Product[] products; final List<Offer> offers; final String label;
    Catalog(Product[] p, List<Offer> o, String l) { products = p; offers = o; label = l; }

    static int maskOf(Product[] p, String csv) {
        int m = 0;
        for (String nm : csv.split(";"))
            for (int i = 0; i < p.length; i++)
                if (p[i].name.equalsIgnoreCase(nm.trim())) m |= (1 << i);
        return m;
    }

    static Catalog base() {
        Product[] p = new Product[] {
            new Product("Laptop", "Electronics", 65000, 52000),
            new Product("Mouse", "Accessories", 999, 799),
            new Product("Keyboard", "Accessories", 1999, 1499),
            new Product("Monitor", "Electronics", 14999, 11999),
            new Product("Backpack", "Bags", 2499, 1799)
        };
        List<Offer> o = new ArrayList<>();
        o.add(new Offer("Laptop + Mouse", maskOf(p, "Laptop;Mouse"), 52299));
        o.add(new Offer("WFH Kit", maskOf(p, "Laptop;Mouse;Backpack"), 53999));
        o.add(new Offer("Desk Setup", maskOf(p, "Keyboard;Monitor"), 12899));
        return new Catalog(p, o, "Standard Catalog");
    }
}

class SOSEngine {
    static final long INF = Long.MAX_VALUE / 4;
    final int n, size; final Product[] products; final List<Offer> offers;
    final long[] bestFit, sumSingles, dp;

    SOSEngine(Product[] p, List<Offer> o) {
        this.products = p; this.offers = o; n = p.length; size = 1 << n;
        bestFit = new long[size]; sumSingles = new long[size]; dp = new long[size];
    }

    static SOSEngine forCart(Catalog cat, List<Integer> items) {
        Product[] p = new Product[items.size()];
        for (int i = 0; i < items.size(); i++) p[i] = cat.products[items.get(i)];
        List<Offer> offs = new ArrayList<>();
        for (Offer o : cat.offers) {
            int nm = 0; boolean ok = true;
            for (int b = 0; b < cat.products.length; b++) {
                if ((o.mask & (1 << b)) == 0) continue;
                int idx = items.indexOf(b);
                if (idx < 0) { ok = false; break; }
                nm |= (1 << idx);
            }
            if (ok && nm != 0) offs.add(new Offer(o.name, nm, o.price));
        }
        return new SOSEngine(p, offs);
    }

    void buildSumSingles() {
        for (int mask = 1; mask < size; mask++) {
            int low = Integer.numberOfTrailingZeros(mask);
            sumSingles[mask] = sumSingles[mask ^ (1 << low)] + products[low].price;
        }
    }

    void buildFitTable() {
        Arrays.fill(bestFit, INF);
        for (Offer o : offers) if (o.mask > 0 && o.mask < size) bestFit[o.mask] = Math.min(bestFit[o.mask], o.price);
        for (int i = 0; i < n; i++) {
            int bit = 1 << i;
            for (int mask = 0; mask < size; mask++) {
                if ((mask & bit) != 0) bestFit[mask] = Math.min(bestFit[mask], bestFit[mask ^ bit]);
            }
        }
    }

    long runPartitionDP() {
        dp[0] = 0;
        for (int mask = 1; mask < size; mask++) {
            int low = Integer.numberOfTrailingZeros(mask);
            long best = products[low].price + dp[mask ^ (1 << low)];
            for (Offer o : offers) {
                if ((o.mask & mask) == o.mask) {
                    best = Math.min(best, o.price + dp[mask ^ o.mask]);
                }
            }
            dp[mask] = best;
        }
        return dp[size - 1];
    }
}
