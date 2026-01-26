"use client";

import { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  Headphones,
  Building2,
  Check,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";

const contactInfo = [
  {
    icon: <Mail className="h-5 w-5" />,
    label: "Email",
    value: "info@bardsantner.com",
    href: "mailto:info@bardsantner.com",
  },
  {
    icon: <Phone className="h-5 w-5" />,
    label: "Phone",
    value: "+27 11 123 4567",
    href: "tel:+27111234567",
  },
  {
    icon: <MapPin className="h-5 w-5" />,
    label: "Address",
    value: "The Towers, Sandton, Johannesburg",
    href: "#",
  },
];

const departments = [
  {
    icon: <MessageSquare className="h-6 w-6" />,
    title: "Editorial",
    email: "editorial@bardsantner.com",
    description: "For news tips, corrections, or editorial inquiries.",
  },
  {
    icon: <Headphones className="h-6 w-6" />,
    title: "Customer Support",
    email: "support@bardsantner.com",
    description: "For subscription issues or technical support.",
  },
  {
    icon: <Building2 className="h-6 w-6" />,
    title: "Advertising",
    email: "advertising@bardsantner.com",
    description: "For advertising and sponsorship opportunities.",
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    department: "general",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setSubmitted(true);
    setIsSubmitting(false);
  };

  return (
    <MainLayout>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
          <p className="text-muted-foreground">
            Have questions, feedback, or need assistance? We&apos;re here to help. Choose the best way to reach us.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
              <h2 className="text-xl font-semibold mb-6">Send us a message</h2>

              {submitted ? (
                <div className="text-center py-12">
                  <div className="h-16 w-16 rounded-full bg-market-up/20 flex items-center justify-center mx-auto mb-4">
                    <Check className="h-8 w-8 text-market-up" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Message Sent!</h3>
                  <p className="text-muted-foreground mb-4">
                    Thank you for contacting us. We&apos;ll get back to you within 24 hours.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        name: "",
                        email: "",
                        subject: "",
                        department: "general",
                        message: "",
                      });
                    }}
                    className="text-brand-orange hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="w-full px-4 py-2.5 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="w-full px-4 py-2.5 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Department</label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-4 py-2.5 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="editorial">Editorial</option>
                      <option value="support">Customer Support</option>
                      <option value="advertising">Advertising</option>
                      <option value="partnerships">Partnerships</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Subject</label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange"
                      placeholder="How can we help?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Message</label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                      rows={6}
                      className="w-full px-4 py-2.5 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-brand-orange resize-none"
                      placeholder="Tell us more about your inquiry..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-brand-orange text-white font-medium rounded-md hover:bg-brand-orange-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      "Sending..."
                    ) : (
                      <>
                        Send Message
                        <Send className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Contact Info Sidebar */}
          <div className="space-y-6">
            {/* Quick Contact */}
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
              <h3 className="font-semibold mb-4">Quick Contact</h3>
              <div className="space-y-4">
                {contactInfo.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="flex items-start gap-3 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <div className="h-10 w-10 rounded-lg bg-brand-orange/20 text-brand-orange flex items-center justify-center flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">{item.label}</div>
                      <div className="text-foreground">{item.value}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Departments */}
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
              <h3 className="font-semibold mb-4">Departments</h3>
              <div className="space-y-4">
                {departments.map((dept) => (
                  <div key={dept.title} className="pb-4 border-b border-terminal-border last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-brand-orange">{dept.icon}</div>
                      <span className="font-medium">{dept.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{dept.description}</p>
                    <a href={`mailto:${dept.email}`} className="text-sm text-brand-orange hover:underline">
                      {dept.email}
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Office Hours */}
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-6">
              <h3 className="font-semibold mb-4">Office Hours</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monday - Friday</span>
                  <span>08:00 - 18:00 SAST</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Saturday</span>
                  <span>09:00 - 13:00 SAST</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sunday</span>
                  <span>Closed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
