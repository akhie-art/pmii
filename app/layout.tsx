import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Poppins } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono-jetbrains",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://pmii.or.id"),
  title: "Portal PMII - Admin & Database Organisasi",
  description: "Aplikasi pengelolaan administrasi, database anggota, dan arsip digital PMII.",
  icons: {
    icon: "/image/logo_komsat.png",
    shortcut: "/image/logo_komsat.png",
    apple: "/image/logo_komsat.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} ${poppins.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var clean = function(node) {
                    if (!node || !node.removeAttribute) return;
                    if (node.hasAttribute('bis_skin_checked')) node.removeAttribute('bis_skin_checked');
                    if (node.hasAttribute('bis_register')) node.removeAttribute('bis_register');
                    var attrs = node.attributes;
                    if (attrs) {
                      for (var i = attrs.length - 1; i >= 0; i--) {
                        var a = attrs[i].name;
                        if (a && a.indexOf('__processed_') === 0) {
                          node.removeAttribute(a);
                        }
                      }
                    }
                  };
                  var obs = new MutationObserver(function(muts) {
                    for (var i = 0; i < muts.length; i++) {
                      var m = muts[i];
                      if (m.type === 'attributes') {
                        var name = m.attributeName;
                        if (name === 'bis_skin_checked' || name === 'bis_register' || (name && name.indexOf('__processed_') === 0)) {
                          m.target.removeAttribute(name);
                        }
                      } else if (m.type === 'childList') {
                        for (var j = 0; j < m.addedNodes.length; j++) {
                          var n = m.addedNodes[j];
                          if (n.nodeType === 1) {
                            clean(n);
                            var sub = n.querySelectorAll ? n.querySelectorAll('[bis_skin_checked], [bis_register]') : [];
                            for (var k = 0; k < sub.length; k++) clean(sub[k]);
                          }
                        }
                      }
                    }
                  });
                  obs.observe(document.documentElement, { attributes: true, childList: true, subtree: true });
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
