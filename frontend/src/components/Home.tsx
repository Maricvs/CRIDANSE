import React from "react";
import WelcomeIntroBlock from "../components/WelcomeIntroBlock";
import DevBanner from "../components/DevBanner";

const Home: React.FC = () => {
  return (
    <main>
      <WelcomeIntroBlock />
      <DevBanner />
    </main>
  );
};

export default Home;