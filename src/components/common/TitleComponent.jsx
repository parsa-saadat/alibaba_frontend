import React from 'react';

function TitleComponent({ partone, parttwo, icon: Icon }) {
  return (
    <div className="inline-flex gap-2 items-center">
      {Icon ? (
        <Icon size={20} className="text-yellow" />
      ) : (
        <p className="w-6 md:w-8 h-[2px] bg-[var(--primary-color)]"></p>
      )}
      <p className="font-black text-lg md:text-xl">
        {partone} <span className="text-yellow font-black">{parttwo}</span>
      </p>
    </div>
  );
}

export default TitleComponent;
