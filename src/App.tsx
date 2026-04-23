import { Route, Routes } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Home } from "@/pages/Home";
import { Browse } from "@/pages/Browse";
import { Categories } from "@/pages/Categories";
import { Submit } from "@/pages/Submit";
import { Leaderboard } from "@/pages/Leaderboard";
import { Blog } from "@/pages/Blog";
import { BlogPost } from "@/pages/BlogPost";
import { Premium } from "@/pages/Premium";
import { Login } from "@/pages/Login";
import { Register } from "@/pages/Register";
import { Dashboard } from "@/pages/Dashboard";
import { About } from "@/pages/About";
import { Contact } from "@/pages/Contact";
import { Privacy } from "@/pages/Privacy";
import { Terms } from "@/pages/Terms";
import { Disclaimer } from "@/pages/Disclaimer";
import { Disclosure } from "@/pages/Disclosure";
import { NotFound } from "@/pages/NotFound";
import { Admin } from "@/pages/Admin";
import { Program } from "@/pages/Program";
import { OfferRedirect } from "@/pages/OfferRedirect";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="browse" element={<Browse />} />
        <Route path="categories" element={<Categories />} />
        <Route path="submit" element={<Submit />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="blog" element={<Blog />} />
        <Route path="blog/:slug" element={<BlogPost />} />
        <Route path="premium" element={<Premium />} />
        <Route path="program/:id" element={<Program />} />
        <Route path="offer/:id" element={<OfferRedirect />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="terms" element={<Terms />} />
        <Route path="disclosure" element={<Disclosure />} />
        <Route path="disclaimer" element={<Disclaimer />} />
        <Route path="admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
