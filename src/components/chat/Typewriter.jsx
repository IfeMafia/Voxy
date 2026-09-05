"use client";

import React, { useState, useEffect } from 'react';

const Typewriter = ({ text, speed = 45, onComplete, renderFinal }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Reset if text changes (e.g. new message)
    setDisplayedText("");
    setIndex(0);
    setDone(false);
  }, [text]);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text.charAt(index));
        setIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else if (index === text.length && index > 0) {
      setDone(true);
      if (onComplete) onComplete();
    }
  }, [index, text, speed, onComplete]);

  // Once typing finishes, switch to rich rendered content (links, etc.)
  if (done && renderFinal) {
    return renderFinal(text);
  }

  return <span>{displayedText}</span>;
};

export default Typewriter;
