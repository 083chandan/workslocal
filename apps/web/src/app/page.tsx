import Architecture from '@/components/Architecture';
import CatchMode from '@/components/CatchMode';
import Comparison from '@/components/Comparison';
import CurrentProblem from '@/components/CurrentProblem';
import DumbPipe from '@/components/DumbPipe';
import Hero from '@/components/Hero';
import Inspector from '@/components/Inspector';

export default function Home() {
  return (
    <main>
      <Hero />
      <CurrentProblem />
      <Inspector />
      <CatchMode />
      <Comparison />
      <DumbPipe />
      <Architecture />
    </main>
  );
}
