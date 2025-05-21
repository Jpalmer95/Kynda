import React from 'react';
import FeaturedItems from '../components/home/FeaturedItems';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div>
      <header style={{ textAlign: 'center', margin: '20px 0 40px 0' }}>
        {/* Hero section or welcome message can go here */}
        <h1>Welcome to Our Coffee Shop!</h1>
        <p>Discover amazing coffee, fresh bites, and unique merchandise.</p>
        <div style={{ marginTop: '20px' }}>
          <Link to="/menu" style={{ margin: '0 10px', padding: '10px 15px', background: '#5cb85c', color: 'white', borderRadius: '5px' }}>
            View Full Menu
          </Link>
          <Link to="/shop" style={{ margin: '0 10px', padding: '10px 15px', background: '#007bff', color: 'white', borderRadius: '5px' }}>
            Shop Merchandise
          </Link>
        </div>
      </header>
      
      <FeaturedItems />

      {/* Other homepage sections can be added here */}
      {/* For example:
      <section style={{textAlign: 'center', marginTop: '40px'}}>
        <h2>About Our Coffee</h2>
        <p>Learn more about our passion for quality and ethically sourced beans.</p>
        <Link to="/about">
            <button>Learn More</button>
        </Link>
      </section>
      */}
    </div>
  );
};

export default HomePage;
