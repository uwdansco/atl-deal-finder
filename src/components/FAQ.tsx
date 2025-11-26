import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const FAQ = () => {
  return (
    <section id="faq" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about our service
          </p>
        </div>

        <Card className="max-w-3xl mx-auto">
          <CardContent className="pt-6">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>How does it work?</AccordionTrigger>
                <AccordionContent>
                  Simply choose the destinations you want to track and set your ideal price threshold for each. 
                  We'll monitor flight prices daily and send you an instant email alert when prices drop below your target. 
                  It's that simple!
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>How many destinations can I track?</AccordionTrigger>
                <AccordionContent>
                  With both our monthly and annual plans, you can track unlimited destinations worldwide. 
                  Set custom price alerts for as many places as you want to visit!
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>Is there a free trial?</AccordionTrigger>
                <AccordionContent>
                  Yes! Both plans come with a 7-day free trial so you can experience the full service risk-free. 
                  No credit card required to start.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger>What is the booking guarantee?</AccordionTrigger>
                <AccordionContent>
                  Annual plan subscribers receive our Booking Guarantee: if you don't book a flight using our alerts 
                  within your subscription year, we'll refund your entire subscription cost. It's our way of ensuring 
                  you get real value from our service.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger>Can I cancel anytime?</AccordionTrigger>
                <AccordionContent>
                  Absolutely! You can cancel your subscription at any time from your account settings. 
                  Your access will continue until the end of your current billing period with no cancellation fees.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6">
                <AccordionTrigger>How often do you check prices?</AccordionTrigger>
                <AccordionContent>
                  We monitor flight prices daily to ensure you get the most up-to-date information. 
                  When a price drops below your threshold, you'll receive an instant notification.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default FAQ;
