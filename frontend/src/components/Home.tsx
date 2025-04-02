import React from "react";
import WelcomeIntroBlock from "./WelcomeIntroBlock";
import DevBanner from "./DevBanner";
import ChatField from "./ChatField";

const Home: React.FC = () => {
  return (
    <main>
      <WelcomeIntroBlock />
      <ChatField />
      <DevBanner />
    </main>
  );
};

export default Home;