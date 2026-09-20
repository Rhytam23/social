import { HomeGate } from '../components/app/HomeGate';
import { Landing } from '../components/landing/Landing';

export default function HomePage() {
  return <HomeGate landing={<Landing />} />;
}
