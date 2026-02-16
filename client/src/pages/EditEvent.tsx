// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  FormControlLabel,
  Switch,
  Card,
  CardContent,
  IconButton,
  Breadcrumbs,
  Link,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  Add,
  Delete,
  NavigateNext,
  Save,
  Preview,
} from '@mui/icons-material';
import { useForm, useFieldArray, type Resolver, type SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsAPI, categoriesAPI } from '../services/api';
import { CreateEventData } from '../types/event';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import type { SelectChangeEvent } from '@mui/material/Select';
import { toast } from 'react-toastify';

const schema = yup.object({
  title: yup.string().required('Event title is required').min(3, 'Title must be at least 3 characters'),
  description: yup.string().required('Event description is required').min(10, 'Description must be at least 10 characters'),
  shortDescription: yup.string().max(200, 'Short description must be less than 200 characters'),
  category: yup.string().required('Category is required'),
  tags: yup.array().of(yup.string()),
  venue: yup.object({
    name: yup.string().required('Venue name is required'),
    address: yup.object({
      street: yup.string(),
      city: yup.string().required('City is required'),
      state: yup.string(),
      zipCode: yup.string(),
      country: yup.string().required('Country is required'),
    }),
    capacity: yup.number().positive('Capacity must be a positive number'),
  }),
  dateTime: yup.object({
    start: yup.date().required('Start date is required'),
    end: yup.date().required('End date is required').min(yup.ref('start'), 'End date must be after start date'),
  }),
  pricing: yup.object({
    isFree: yup.boolean(),
    currency: yup.string(),
    tiers: yup.array().of(yup.object({
      name: yup.string().required('Tier name is required'),
      price: yup.number().min(0, 'Price must be non-negative').required('Price is required'),
      description: yup.string(),
      quantity: yup.number().positive('Quantity must be positive'),
    })),
  }),
  visibility: yup.string().oneOf(['public', 'private', 'unlisted']),
});

type EventFormData = yup.InferType<typeof schema>;

const EditEvent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDraft, setIsDraft] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<EventFormData>({
    resolver: yupResolver(schema) as unknown as Resolver<EventFormData>,
  });

  const { fields: tierFields, append: appendTier, remove: removeTier } = useFieldArray<EventFormData>({
    control,
    name: 'pricing.tiers' as const,
  });

  const { fields: tagFields, append: appendTag, remove: removeTag } = useFieldArray<any>({
    control,
    name: 'tags' as const,
  });

  // Images manager
  const { fields: imageFields, append: appendImage, remove: removeImage, update: updateImage } = useFieldArray<any>({
    control,
    name: 'images' as const,
  });

  const handleLocalFile = (index: number, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      updateImage(index, { ...(watch(`images.${index}`) || {}), url: result, alt: file.name });
    };
    reader.readAsDataURL(file);
  };

  // Fetch event details
  const { data: eventData, isLoading: eventLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: (): ReturnType<typeof eventsAPI.getById> => eventsAPI.getById(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (!eventData || !('data' in eventData)) return;
    const event = (eventData as Awaited<ReturnType<typeof eventsAPI.getById>>).data.event;
    reset({
      title: event.title,
      description: event.description,
      shortDescription: event.shortDescription || '',
      category: event.category._id,
      tags: event.tags || [],
      venue: {
        name: event.venue.name,
        address: {
          street: event.venue.address.street || '',
          city: event.venue.address.city,
          state: event.venue.address.state || '',
          zipCode: event.venue.address.zipCode || '',
          country: event.venue.address.country,
        },
        capacity: event.venue.capacity || undefined,
      },
      dateTime: {
        start: new Date(event.dateTime.start),
        end: new Date(event.dateTime.end),
      },
      pricing: {
        isFree: event.pricing.isFree,
        currency: event.pricing.currency,
        tiers: event.pricing.tiers.map(tier => ({
          name: tier.name,
          price: tier.price,
          description: tier.description || '',
          quantity: tier.quantity || undefined,
        })),
      },
      visibility: event.visibility,
      images: (event.images || []).map((img: any) => ({ url: img.url, alt: img.alt, isPrimary: !!img.isPrimary })),
    });
    setIsDraft(event.status === 'draft');
  }, [eventData, reset]);

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getAll(),
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: (data: CreateEventData) => eventsAPI.update(id!, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      toast.success("Event updated successfully!");
      navigate(`/events/${response.data.event._id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update event");
    },
  });

  const onSubmit: SubmitHandler<EventFormData> = (data) => {
    const eventData: CreateEventData = {
      title: data.title,
      description: data.description,
      shortDescription: data.shortDescription,
      category: data.category,
      tags: (data.tags ?? []).filter((t): t is string => typeof t === 'string'),
      images: (data.images ?? []).map((img: any, idx: number) => ({
        url: img.url,
        alt: img.alt || data.title,
        isPrimary: Boolean(img.isPrimary) || idx === 0,
      })),
      venue: {
        name: data.venue.name,
        address: {
          street: data.venue.address.street,
          city: data.venue.address.city,
          state: data.venue.address.state,
          zipCode: data.venue.address.zipCode,
          country: data.venue.address.country,
        },
        capacity: data.venue.capacity,
      },
      dateTime: {
        start: data.dateTime.start.toISOString(),
        end: data.dateTime.end.toISOString(),
        timezone: 'UTC',
      },
      pricing: {
        isFree: data.pricing?.isFree ?? false,
        currency: data.pricing?.currency || 'USD',
        tiers: (data.pricing?.tiers ?? []).filter(tier => tier.name && tier.price >= 0),
      },
      capacity: {
        total: data.venue.capacity,
      },
      visibility: data.visibility as CreateEventData['visibility'],
    };

    updateEventMutation.mutate(eventData);
  };

  const addTier = () => {
    appendTier({ name: '', price: 0, description: '', quantity: 100 });
  };

  const addTag = () => {
    appendTag('' as any);
  };

  if (eventLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!eventData?.data.event) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Event not found.
        </Alert>
      </Container>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ py: 4 }}>
        <Container maxWidth="lg">
          {/* Breadcrumbs */}
          <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 3 }}>
            <Link
              color="inherit"
              href="/"
              onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.preventDefault();
                navigate('/');
              }}
            >
              Home
            </Link>
            <Link
              color="inherit"
              href="/dashboard"
              onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.preventDefault();
                navigate('/dashboard');
              }}
            >
              Dashboard
            </Link>
            <Link
              color="inherit"
              href={`/events/${id}`}
              onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.preventDefault();
                navigate(`/events/${id}`);
              }}
            >
              {eventData.data.event.title}
            </Link>
            <Typography color="text.primary">Edit</Typography>
          </Breadcrumbs>

          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Edit Event
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Update your event details
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={4}>
              {/* Basic Information */}
              <Grid xs={12} md={8}>
                <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Basic Information
                  </Typography>

                  <TextField
                    fullWidth
                    label="Event Title"
                    margin="normal"
                    {...register('title')}
                    error={!!errors.title}
                    helperText={errors.title?.message}
                  />

                  <FormControl fullWidth margin="normal" error={!!errors.category}>
                    <InputLabel>Category</InputLabel>
                    <Select
                      label="Category"
                      {...register('category')}
                    >
                      {categoriesData?.data.categories.map((category: any) => (
                        <MenuItem key={category._id} value={category._id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.category && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                        {errors.category.message}
                      </Typography>
                    )}
                  </FormControl>

                  <TextField
                    fullWidth
                    label="Short Description"
                    margin="normal"
                    multiline
                    rows={2}
                    placeholder="Brief description that will appear in event listings"
                    {...register('shortDescription')}
                    error={!!errors.shortDescription}
                    helperText={errors.shortDescription?.message}
                  />

                  <TextField
                    fullWidth
                    label="Full Description"
                    margin="normal"
                    multiline
                    rows={6}
                    placeholder="Detailed description of your event"
                    {...register('description')}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                  />

                  {/* Tags */}
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Tags
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      {tagFields.map((field, index) => (
                        <Chip
                          key={field.id}
                          label={watch(`tags.${index}`) || `Tag ${index + 1}`}
                          onDelete={() => removeTag(index)}
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                      <Chip
                        label="Add Tag"
                        onClick={addTag}
                        color="primary"
                        variant="outlined"
                        icon={<Add />}
                      />
                    </Box>
                  </Box>
                </Paper>

                {/* Images */}
                <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Images
                  </Typography>

                  <Grid container spacing={2}>
                    {imageFields.map((field, index) => (
                      <Grid xs={12} key={field.id}>
                        <Card sx={{ mb: 2 }}>
                          <CardContent>
                            <Grid container spacing={2} alignItems="center">
                              <Grid xs={12} md={4}>
                                <Box sx={{
                                  width: '100%',
                                  height: 160,
                                  borderRadius: 2,
                                  overflow: 'hidden',
                                  bgcolor: 'grey.100',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}>
                                  {watch(`images.${index}.url`) ? (
                                    <img
                                      src={watch(`images.${index}.url`)}
                                      alt={watch(`images.${index}.alt`) || 'preview'}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                  ) : (
                                    <Typography variant="caption" color="text.secondary">Preview</Typography>
                                  )}
                                </Box>
                              </Grid>
                              <Grid xs={12} md={8}>
                                <TextField
                                  fullWidth
                                  label="Image URL"
                                  margin="dense"
                                  {...register(`images.${index}.url`)}
                                />
                                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                  <Button variant="outlined" component="label" size="small">
                                    Upload from device
                                    <input
                                      type="file"
                                      accept="image/*"
                                      hidden
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleLocalFile(index, file);
                                      }}
                                    />
                                  </Button>
                                  <Button size="small" onClick={() => window.open(watch(`images.${index}.url`) || '#', '_blank')}>Open URL</Button>
                                </Box>
                                <TextField
                                  fullWidth
                                  label="Alt Text"
                                  margin="dense"
                                  {...register(`images.${index}.alt`)}
                                />
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                                  <FormControlLabel
                                    control={<Switch checked={!!watch(`images.${index}.isPrimary`)} onChange={(e) => {
                                      imageFields.forEach((_, i) => updateImage(i, {
                                        ...(watch(`images.${i}`) || {}),
                                        isPrimary: i === index ? e.target.checked : false,
                                      }));
                                    }} />}
                                    label="Primary image"
                                  />
                                  <IconButton color="error" onClick={() => removeImage(index)}>
                                    <Delete />
                                  </IconButton>
                                </Box>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>

                  <Button variant="outlined" startIcon={<Add />} onClick={() => appendImage({ url: '', alt: '', isPrimary: imageFields.length === 0 })}>
                    Add Image
                  </Button>
                </Paper>

                {/* Date & Time */}
                <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Date & Time
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid xs={12} sm={6}>
                      <DateTimePicker
                        label="Start Date & Time"
                        value={watch('dateTime.start') ? dayjs(watch('dateTime.start')) : null}
                        onChange={(newValue) => setValue('dateTime.start', newValue?.toDate() || new Date())}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            margin: 'normal',
                            error: !!errors.dateTime?.start,
                            helperText: errors.dateTime?.start?.message,
                          },
                        }}
                      />
                    </Grid>
                    <Grid xs={12} sm={6}>
                      <DateTimePicker
                        label="End Date & Time"
                        value={watch('dateTime.end') ? dayjs(watch('dateTime.end')) : null}
                        onChange={(newValue) => setValue('dateTime.end', newValue?.toDate() || new Date())}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            margin: 'normal',
                            error: !!errors.dateTime?.end,
                            helperText: errors.dateTime?.end?.message,
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                </Paper>

                {/* Venue Information */}
                <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Venue Information
                  </Typography>

                  <TextField
                    fullWidth
                    label="Venue Name"
                    margin="normal"
                    {...register('venue.name')}
                    error={!!errors.venue?.name}
                    helperText={errors.venue?.name?.message}
                  />

                  <Grid container spacing={2}>
                    <Grid xs={12} sm={8}>
                      <TextField
                        fullWidth
                        label="Street Address"
                        margin="normal"
                        {...register('venue.address.street')}
                      />
                    </Grid>
                    <Grid xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Capacity"
                        type="number"
                        margin="normal"
                        {...register('venue.capacity', { valueAsNumber: true })}
                        error={!!errors.venue?.capacity}
                        helperText={errors.venue?.capacity?.message}
                      />
                    </Grid>
                  </Grid>

                  <Grid container spacing={2}>
                    <Grid xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="City"
                        margin="normal"
                        {...register('venue.address.city')}
                        error={!!errors.venue?.address?.city}
                        helperText={errors.venue?.address?.city?.message}
                      />
                    </Grid>
                    <Grid xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="State/Province"
                        margin="normal"
                        {...register('venue.address.state')}
                      />
                    </Grid>
                    <Grid xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="ZIP/Postal Code"
                        margin="normal"
                        {...register('venue.address.zipCode')}
                      />
                    </Grid>
                  </Grid>

                  <TextField
                    fullWidth
                    label="Country"
                    margin="normal"
                    {...register('venue.address.country')}
                    error={!!errors.venue?.address?.country}
                    helperText={errors.venue?.address?.country?.message}
                  />
                </Paper>
              </Grid>

              {/* Pricing & Settings */}
              <Grid xs={12} md={4}>
                <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Pricing
                  </Typography>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={watch('pricing.isFree')}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue('pricing.isFree', e.target.checked)}
                      />
                    }
                    label="Free Event"
                    sx={{ mb: 2 }}
                  />

                  {!watch('pricing.isFree') && (
                    <>
                      <FormControl fullWidth margin="normal">
                        <InputLabel>Currency</InputLabel>
                        <Select
                          label="Currency"
                          value={watch('pricing.currency')}
                          onChange={(e: SelectChangeEvent) => setValue('pricing.currency', e.target.value as string)}
                        >
                          <MenuItem value="USD">USD</MenuItem>
                          <MenuItem value="EUR">EUR</MenuItem>
                          <MenuItem value="GBP">GBP</MenuItem>
                          <MenuItem value="CAD">CAD</MenuItem>
                        </Select>
                      </FormControl>

                      <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                        Ticket Tiers
                      </Typography>

                      {tierFields.map((field, index) => (
                        <Card key={field.id} sx={{ mb: 2, p: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle2">
                              Tier {index + 1}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => removeTier(index)}
                              color="error"
                            >
                              <Delete />
                            </IconButton>
                          </Box>

                          <TextField
                            fullWidth
                            label="Tier Name"
                            size="small"
                            margin="dense"
                            {...register(`pricing.tiers.${index}.name`)}
                            error={!!errors.pricing?.tiers?.[index]?.name}
                            helperText={errors.pricing?.tiers?.[index]?.name?.message}
                          />

                          <Grid container spacing={1}>
                            <Grid item xs={6}>
                              <TextField
                                fullWidth
                                label="Price"
                                type="number"
                                size="small"
                                margin="dense"
                                {...register(`pricing.tiers.${index}.price`, { valueAsNumber: true })}
                                error={!!errors.pricing?.tiers?.[index]?.price}
                                helperText={errors.pricing?.tiers?.[index]?.price?.message}
                              />
                            </Grid>
                            <Grid item xs={6}>
                              <TextField
                                fullWidth
                                label="Quantity"
                                type="number"
                                size="small"
                                margin="dense"
                                {...register(`pricing.tiers.${index}.quantity`, { valueAsNumber: true })}
                                error={!!errors.pricing?.tiers?.[index]?.quantity}
                                helperText={errors.pricing?.tiers?.[index]?.quantity?.message}
                              />
                            </Grid>
                          </Grid>

                          <TextField
                            fullWidth
                            label="Description"
                            size="small"
                            margin="dense"
                            multiline
                            rows={2}
                            {...register(`pricing.tiers.${index}.description`)}
                          />
                        </Card>
                      ))}

                      <Button
                        variant="outlined"
                        startIcon={<Add />}
                        onClick={addTier}
                        fullWidth
                        sx={{ mt: 1 }}
                      >
                        Add Tier
                      </Button>
                    </>
                  )}
                </Paper>

                {/* Event Settings */}
                <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Event Settings
                  </Typography>

                  <FormControl fullWidth margin="normal">
                    <InputLabel>Visibility</InputLabel>
                    <Select
                      label="Visibility"
                      value={watch('visibility')}
                      onChange={(e: SelectChangeEvent) => setValue('visibility', e.target.value as string)}
                    >
                      <MenuItem value="public">Public</MenuItem>
                      <MenuItem value="unlisted">Unlisted</MenuItem>
                      <MenuItem value="private">Private</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={isDraft}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsDraft(e.target.checked)}
                      />
                    }
                    label="Save as Draft"
                    sx={{ mt: 2 }}
                  />
                </Paper>

                {/* Actions */}
                <Paper elevation={2} sx={{ p: 3 }}>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Actions
                  </Typography>

                  {updateEventMutation.error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {updateEventMutation.error.message}
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    startIcon={<Save />}
                    disabled={updateEventMutation.isPending}
                    sx={{ mb: 2 }}
                  >
                    {updateEventMutation.isPending ? (
                      <CircularProgress size={20} />
                    ) : (
                      isDraft ? 'Save as Draft' : 'Update Event'
                    )}
                  </Button>

                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Preview />}
                    disabled={updateEventMutation.isPending}
                    onClick={() => navigate(`/events/${id}`)}
                  >
                    Preview
                  </Button>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Container>
      </Box>
    </LocalizationProvider>
  );
};

export default EditEvent;
