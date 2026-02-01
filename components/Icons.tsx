import React from 'react';

export const MagicWandIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6.25278V4.85073C12 4.10526 12.6077 3.5 13.3532 3.5C14.0986 3.5 14.7064 4.10526 14.7064 4.85073V6.25278"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.17647 7.59822L10.222 6.55273"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14.7064 9.17647L13.6609 10.222"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.25 13.3532H20.652C21.3975 13.3532 22 12.7455 22 12C22 11.2545 21.3975 10.6468 20.652 10.6468H19.25"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17.9045 14.7064L18.95 13.6609"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.25278 12H4.85073C4.10526 12 3.5 12.6077 3.5 13.3532C3.5 14.0986 4.10526 14.7064 4.85073 14.7064H6.25278"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7.59822 9.17647L6.55273 10.222"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13.6609 17.9045L14.7064 18.95"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10.222 6.55273L4.85073 1.18124"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.5 21.5L8.29353 15.7065C8.68406 15.316 9.31722 15.316 9.70775 15.7065L12.5363 18.535C12.9268 18.9255 13.56 18.9255 13.9505 18.535L15.7065 16.7791C16.097 16.3886 16.7302 16.3886 17.1207 16.7791L21.5 21.1584"
    />
  </svg>
);

export const DownloadIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
    />
  </svg>
);

export const LoadingSpinner: React.FC = () => (
  <svg
    className="animate-spin h-5 w-5 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

export const PlusIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
    </svg>
);

export const CloseIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export const RegenerateIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.899 2.186l-1.42.422a5.002 5.002 0 00-8.583-1.602l1.118 1.117a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 1.414L5 5.101V3a1 1 0 01-1-1zM15 17a1 1 0 01-1-1v-2.101a7.002 7.002 0 01-11.899-2.186l1.42-.422a5.002 5.002 0 008.583 1.602l-1.118-1.117a1 1 0 011.414-1.414l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L15 14.899V17z" clipRule="evenodd" />
    </svg>
);

export const ImageIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);
