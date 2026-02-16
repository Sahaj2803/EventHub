import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShareIcon from '@mui/icons-material/Share';
import { useFavorites } from '../../contexts/FavoritesContext';

interface Props {
  eventId: string;
  title: string;
  image?: string;
  categoryName?: string;
}

const EventCardActions: React.FC<Props> = ({ eventId, title, image, categoryName }) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(eventId);

  const onShare = async () => {
    const url = `${window.location.origin}/events/${eventId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        // Optional: could toast here, but keep component pure
      }
    } catch {}
  };

  return (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      <Tooltip title={fav ? 'Remove from favorites' : 'Save to favorites'}>
        <IconButton
          aria-label="favorite"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite({ _id: eventId, title, image, categoryName });
          }}
          color={fav ? 'error' : 'default'}
          size="small"
        >
          {fav ? <FavoriteIcon /> : <FavoriteBorderIcon />}
        </IconButton>
      </Tooltip>
      <Tooltip title="Share">
        <IconButton aria-label="share" onClick={(e) => { e.stopPropagation(); onShare(); }} size="small">
          <ShareIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default EventCardActions;


