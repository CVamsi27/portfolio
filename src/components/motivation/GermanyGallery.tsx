"use client";

import { useState } from "react";
import Image from "next/image";
import photos from "@/data/germany-motivation.json";

export default function GermanyGallery() {
  const [selected, setSelected] = useState(photos[0].id);
  const [failed, setFailed] = useState<string[]>([]);
  const photo = photos.find((item) => item.id === selected) ?? photos[0];
  const imageFailed = failed.includes(photo.id);

  return (
    <figure className="germany-gallery" aria-label="Views of Germany">
      <div className="germany-gallery__image">
        {imageFailed ? (
          <p role="status">
            This photo couldn’t load. Choose another view below.
          </p>
        ) : (
          <Image
            key={photo.id}
            data-testid="focus-media"
            src={photo.src}
            alt={photo.alt}
            width={1800}
            height={1200}
            unoptimized
            fetchPriority="high"
            style={{ objectPosition: photo.position }}
            onError={() => setFailed((previous) => [...previous, photo.id])}
          />
        )}
      </div>
      <figcaption>
        <div className="germany-gallery__caption">
          <span data-testid="focus-scene-category">{photo.location}</span>
          {!imageFailed && (
            <a href={photo.sourceUrl} target="_blank" rel="noopener noreferrer">
              {photo.photographer} / Unsplash
            </a>
          )}
        </div>
        <div
          className="germany-gallery__choices"
          role="group"
          aria-label="Choose a Germany view"
        >
          {photos.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={item.id === selected}
              onClick={() => setSelected(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </figcaption>
    </figure>
  );
}
