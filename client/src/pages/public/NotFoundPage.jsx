import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, ArrowLeft } from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';

export const NotFoundPage = () => {
  return (
    <div className="py-20 lg:py-32 bg-slate-50 min-h-[70vh] flex items-center justify-center">
      <Container>
        <div className="max-w-md mx-auto text-center space-y-6">
          <div className="text-7xl font-black text-brand-600 font-mono tracking-wider">
            404
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Page Not Found</h1>
          <p className="text-slate-600 text-sm leading-relaxed">
            The page you are looking for might have been moved or does not exist.
          </p>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button to="/" variant="primary" size="md" icon={Home}>
              Go to Homepage
            </Button>
            <Button to="/properties" variant="outline" size="md" icon={Search}>
              Explore Stays
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default NotFoundPage;
