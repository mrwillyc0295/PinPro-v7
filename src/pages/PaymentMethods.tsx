import { CreditCard, Shield, Info, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { AnimatedBackButton } from '../components/AnimatedBackButton';

declare global {
  interface Window {
    paypal: any;
  }
}

export default function PaymentMethods() {
  const navigate = useNavigate();
  const [isPaypalLoading, setIsPaypalLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const renderButton = () => {
      if (!mounted) return;

      if (window.paypal && window.paypal.HostedButtons) {
        const container = document.getElementById("paypal-container-GAQF9FDJTTJHS");
        if (container && container.innerHTML === "") {
          try {
            window.paypal.HostedButtons({
              hostedButtonId: "GAQF9FDJTTJHS",
            }).render("#paypal-container-GAQF9FDJTTJHS");
          } catch (err) {
            console.error("PayPal render error:", err);
          }
        }
        setIsPaypalLoading(false);
      } else {
        // Retry after a short delay if not yet ready
        timeoutId = setTimeout(renderButton, 500);
      }
    };

    if (window.paypal && window.paypal.HostedButtons) {
      renderButton();
    } else {
      const existingScript = document.querySelector('script[src*="paypal.com/sdk/js"]');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = "https://www.paypal.com/sdk/js?client-id=BAA2PMekKu_cWIs0FHQY-HDDeIbbMz7xt7ERJwIJDvpDB3YV7TCN4jiEf0AoTQWCcIePa_l1GTifdUjFzQ&components=hosted-buttons&disable-funding=venmo&currency=USD";
        script.async = true;
        // crossorigin is removed specifically for paypal as it has an opaque response sometimes
        // which triggers a "Script Error" without resolving it. Using standard loading is safer.
        script.onload = renderButton;
        script.onerror = (err) => {
          console.error("PayPal SDK failed to load", String(err));
          if (mounted) setIsPaypalLoading(false);
        };
        document.body.appendChild(script);
      } else {
        renderButton();
      }
    }

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="flex-1 w-full h-full bg-surface-lowest overflow-y-auto hide-scrollbar flex flex-col relative pb-10">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-surface-lowest/90 backdrop-blur-xl border-b border-primary-container/20 shadow-[0_4px_20px_-10px_rgba(0,255,255,0.3)] px-5 py-4 pt-12 flex items-center justify-center">
        <h1 className="text-lg font-bold text-on-surface tracking-wide drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">Métodos de Pago</h1>
        <div className="w-10 h-10 flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-primary-container drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]" />
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col gap-6 max-w-2xl mx-auto w-full">
        {/* Trust Banner */}
        <div className="bg-gradient-to-br from-primary-container/10 to-transparent p-6 rounded-3xl border border-primary-container/20 flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary-container/10 rounded-full blur-2xl -mr-8 -mt-8"></div>
          <div className="flex items-center gap-3 text-primary-container">
            <Shield className="w-6 h-6 drop-shadow-[0_0_8px_rgba(0,255,255,0.5)]" />
            <h2 className="text-lg font-bold">Transacciones Protegidas</h2>
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Tus datos bancarios están encriptados y procesados de forma segura. PinPro no almacena información sensible de tus tarjetas.
          </p>
        </div>

        {/* PayPal Section */}
        <div className="flex flex-col gap-4">
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-2">Billeteras Virtuales</h3>
          <div className="bg-white p-10 rounded-[48px] border border-outline-variant shadow-2xl flex flex-col items-center justify-center min-h-[400px] text-black w-full overflow-hidden">
            <style>
              {`
                /* Ensure typography is respected */
                #paypal-container-GAQF9FDJTTJHS,
                #paypal-container-GAQF9FDJTTJHS *,
                .paypal-hosted-button-container,
                .paypal-hosted-button-container * {
                  color: #000000 !important;
                  font-family: sans-serif !important;
                }

                /* Force specific button text to white */
                #checkout-button, #checkout-button * {
                  color: #ffffff !important;
                }

                /* Contain PayPal elements to prevent overflow */
                #paypal-container-GAQF9FDJTTJHS {
                    display: block !important;
                    width: 100% !important;
                    max-width: 100% !important;
                    text-align: center !important;
                }

                /* Make internal forms or iframes responsive */
                #paypal-container-GAQF9FDJTTJHS iframe,
                #paypal-container-GAQF9FDJTTJHS form,
                .paypal-hosted-button-container {
                    width: 100% !important;
                    max-width: 300px !important;
                    margin: 0 auto !important;
                    display: block !important;
                }
              `}
            </style>
            {isPaypalLoading && (
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-4 border-primary-container border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-on-surface-variant font-bold">Cargando integración de PayPal...</p>
              </div>
            )}
            <div className={cn("w-full flex justify-center items-center min-w-0 overflow-hidden", isPaypalLoading ? "hidden" : "flex")}>
              <div id="paypal-container-GAQF9FDJTTJHS" className="w-full max-w-[300px] mx-auto flex items-center justify-center"></div>
            </div>
            {!isPaypalLoading && (
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500 font-medium leading-relaxed">Paga suscripciones y vincula tu cuenta de <span className="font-bold text-blue-900">PayPal</span> para transacciones ágiles y protegidas.</p>
              </div>
            )}
          </div>
        </div>


        {/* Footer Info - Removed for PWA cleanup */}
      </div>


    </div>
  );
}
