import React from 'react';
import { School } from 'lucide-react';

interface SchoolLogoProps {
  logoUrl?: string;
  className?: string;
  fallbackClassName?: string;
  alt?: string;
}

export const SchoolLogo: React.FC<SchoolLogoProps> = ({
  logoUrl,
  className = 'h-full w-full object-contain',
  fallbackClassName = 'h-1/2 w-1/2',
  alt = 'Logo sekolah',
}) => (
  logoUrl
    ? <img src={logoUrl} alt={alt} className={className} />
    : <School className={fallbackClassName} />
);
