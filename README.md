# safehaven
SafeHaven: An AI-Powered Lifeline for Climate Refugees

# 🌍 SafeHaven: An AI-Powered Lifeline for Climate Refugees

SafeHaven is a multilingual AI-powered chatbot designed to provide real-time, location-aware **legal aid**, **relocation guidance**, and **emergency assistance** for people displaced by climate-related disasters. Built using IBM Watson Discovery, watsonx.ai, and Retrieval-Augmented Generation (RAG), SafeHaven delivers accurate, context-specific, and compassionate support — anytime, anywhere, and in multiple languages.

---

## 🚨 Why SafeHaven?

Climate change is triggering the largest human displacement crisis in history. Rising sea levels, droughts, and extreme weather are forcing tens of millions to flee their homes — often without legal protections or access to aid.

SafeHaven fills the critical information and assistance gap faced by **climate refugees**, **humanitarian workers**, and **NGOs** on the ground by:

- Offering multilingual, mobile-first AI support
- Delivering accurate and localized legal and emergency info
- Running reliably under crisis and low-connectivity conditions

---

## 💡 Key Features

| Feature | Description |
|--------|-------------|
| 🌐 **Multilingual Support** | Arabic, Bengali, French, Swahili, and English (with plans to expand) |
| 🧠 **RAG + IBM Watson** | Combines dynamic retrieval (UNHCR, local legal docs, NGO databases) with AI-generated natural language answers |
| 📍 **Location-Aware** | Adjusts responses based on user’s location for context-specific guidance |
| 📲 **Mobile-First UX** | Voice and text interaction on low-bandwidth web interfaces |
| 🆘 **Emergency Escalation** | Connects to NGO networks to trigger alerts or escalate urgent requests |
| 🔐 **Privacy-First Design** | Minimal data retention; focused on safety and confidentiality |

---

## 🧱 Architecture

- **Frontend**: Mobile-friendly React web app with voice and text input
- **Backend**: Node.js/Express API handling requests and interfacing with IBM Cloud services
- **AI & NLP**: 
  - IBM Watson Discovery for real-time retrieval
  - watsonx.ai + RAG for contextual response generation
- **Deployment**: IBM Cloud (scalable, reliable, offline-tolerant)
