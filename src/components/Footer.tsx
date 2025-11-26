import { Plane } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary/30 border-t border-border">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-sky rounded-lg flex items-center justify-center">
                <Plane className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">Cheap Atlanta Flights</span>
            </div>
            <p className="text-muted-foreground mb-4 max-w-md">
              Your trusted source for exclusive flight deals from Atlanta (ATL). 
              We track prices daily so you can travel more and spend less.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span>5,000+ subscribers saving on flights</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Quick Links</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link to="/pricing" className="hover:text-primary transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/deals" className="hover:text-primary transition-colors">
                  Recent Deals
                </Link>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-primary transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-primary transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Legal</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <a href="#privacy" className="hover:text-primary transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#terms" className="hover:text-primary transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-primary transition-colors">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>
              © {currentYear} Cheap Atlanta Flights. All rights reserved.
            </p>
            <p className="text-center md:text-right">
              Made with ❤️ for Atlanta travelers. 
              <span className="ml-2">Not affiliated with any airline.</span>
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg text-xs text-muted-foreground">
          <p className="text-center">
            Disclaimer: Flight prices are subject to change and availability. 
            We are not responsible for pricing errors or flight availability. 
            All deals are sent for informational purposes only.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
