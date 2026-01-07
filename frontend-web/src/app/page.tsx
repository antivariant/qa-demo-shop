import Hero from "@/components/features/Hero";
import Store from "@/components/features/Store";
import About from "@/components/features/About";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.main}>
      <Hero />
      <Store />
      <About />
    </div>
  );
}
