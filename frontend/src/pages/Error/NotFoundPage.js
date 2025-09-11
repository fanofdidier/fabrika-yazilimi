import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Card } from '../../components/UI';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-soft">
          <Card.Body className="text-center py-12">
            <div className="mb-8">
              <h1 className="text-9xl font-bold text-gray-300">404</h1>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Sayfa Bulunamadı
            </h2>
            <p className="text-gray-600 mb-8">
              Aradığınız sayfa mevcut değil veya taşınmış olabilir.
            </p>
            <div className="space-y-4">
              <Button
                as={Link}
                to="/"
                variant="primary"
                size="lg"
                className="w-full"
              >
                Ana Sayfaya Dön
              </Button>
              <Button
                onClick={() => window.history.back()}
                variant="outline"
                size="lg"
                className="w-full"
              >
                Geri Git
              </Button>
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default NotFoundPage;