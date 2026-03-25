import Architecture from '@/components/Architecture';
import CatchMode from '@/components/CatchMode';
import Comparison from '@/components/Comparison';
import CurrentProblem from '@/components/CurrentProblem';
import DumbPipe from '@/components/DumbPipe';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import Inspector from '@/components/Inspector';
import NavHeader from '@/components/NavHeader';

export default function Home() {
  return (
    <>
      <NavHeader></NavHeader>
      <main>
        <Hero></Hero>
        <CurrentProblem></CurrentProblem>
        <Inspector></Inspector>
        <CatchMode></CatchMode>
        <Comparison></Comparison>
        <DumbPipe></DumbPipe>
        <Architecture></Architecture>
        <Footer></Footer>
      </main>
    </>
  );
}
