import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Badge } from '../ui/badge';
import { Loader2, Sparkles, ChevronDown, ChevronUp, X } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const BUSINESS_CATEGORIES = [
  'Food & Beverage',
  'Technology',
  'Healthcare',
  'Fashion & Beauty',
  'Education',
  'Finance',
  'Entertainment',
  'Real Estate',
  'Fitness & Wellness',
  'Professional Services',
  'Retail',
  'Other'
];

const AGE_GROUPS = [
  '13-18',
  '19-25',
  '26-35',
  '36-45',
  '46-55',
  '56-65',
  '65+'
];

const COUNTRIES = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Japan',
  'China',
  'India',
  'Brazil',
  'Mexico',
  'South Korea',
  'Singapore',
  'Netherlands',
  'Spain',
  'Italy',
  'Sweden',
  'Switzerland',
  'United Arab Emirates',
  'Other'
];

export const InputForm = ({ onSuccess }) => {
  const { 
    setPalettes, 
    setBusinessInfo, 
    isGenerating, 
    setIsGenerating,
    setRateLimits,
    palettes
  } = useAppContext();

  const [formData, setFormData] = useState({
    business_name: '',
    business_category: '',
    target_country: '',
    age_groups: [],
    target_gender: 'All Genders',
    brand_values: '',
    competitors: ''
  });

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.business_name.trim()) {
      newErrors.business_name = 'Business name is required';
    }
    if (!formData.business_category) {
      newErrors.business_category = 'Please select a category';
    }
    if (!formData.target_country) {
      newErrors.target_country = 'Please select a country';
    }
    if (formData.age_groups.length === 0) {
      newErrors.age_groups = 'Please select at least one age group';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const toggleAgeGroup = (age) => {
    setFormData(prev => ({
      ...prev,
      age_groups: prev.age_groups.includes(age)
        ? prev.age_groups.filter(a => a !== age)
        : [...prev.age_groups, age]
    }));
    if (errors.age_groups) {
      setErrors(prev => ({ ...prev, age_groups: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await axios.post(`${API}/generate-palettes`, formData);
      
      setPalettes(response.data.palettes);
      setBusinessInfo(formData);
      setRateLimits(prev => ({
        ...prev,
        generations_remaining: response.data.remaining_generations
      }));
      
      toast.success('Palettes generated successfully!');
      setIsCollapsed(true);
      onSuccess?.();
    } catch (error) {
      if (error.response?.status === 429) {
        toast.error('Daily limit reached. Please try again tomorrow.');
      } else {
        toast.error('Failed to generate palettes. Please try again.');
      }
      console.error('Generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-collapse if palettes exist
  React.useEffect(() => {
    if (palettes.length > 0) {
      setIsCollapsed(true);
    }
  }, [palettes]);

  return (
    <div className="mb-8" data-testid="input-form-container">
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between p-4 bg-secondary/50 rounded-xl mb-4 hover:bg-secondary transition-colors"
        data-testid="form-collapse-toggle"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5" />
          <span className="font-heading font-bold text-lg">
            {palettes.length > 0 ? 'Edit Business Details' : 'Enter Business Details'}
          </span>
        </div>
        {isCollapsed ? (
          <ChevronDown className="w-5 h-5" />
        ) : (
          <ChevronUp className="w-5 h-5" />
        )}
      </button>

      {/* Form Content */}
      {!isCollapsed && (
        <form onSubmit={handleSubmit} className="animate-fade-in" data-testid="palette-form">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Business Name */}
            <div className="space-y-2">
              <Label htmlFor="business_name" className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
                Business Name *
              </Label>
              <Input
                id="business_name"
                data-testid="business-name-input"
                placeholder="e.g., Sunrise Coffee Co."
                value={formData.business_name}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, business_name: e.target.value }));
                  if (errors.business_name) setErrors(prev => ({ ...prev, business_name: undefined }));
                }}
                className={errors.business_name ? 'border-destructive' : ''}
              />
              {errors.business_name && (
                <p className="text-sm text-destructive">{errors.business_name}</p>
              )}
            </div>

            {/* Business Category */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
                Business Category *
              </Label>
              <Select
                value={formData.business_category}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, business_category: value }));
                  if (errors.business_category) setErrors(prev => ({ ...prev, business_category: undefined }));
                }}
              >
                <SelectTrigger data-testid="category-select" className={errors.business_category ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} data-testid={`category-${cat.toLowerCase().replace(/\s+/g, '-')}`}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.business_category && (
                <p className="text-sm text-destructive">{errors.business_category}</p>
              )}
            </div>

            {/* Target Country */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
                Target Country *
              </Label>
              <Select
                value={formData.target_country}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, target_country: value }));
                  if (errors.target_country) setErrors(prev => ({ ...prev, target_country: undefined }));
                }}
              >
                <SelectTrigger data-testid="country-select" className={errors.target_country ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country} value={country} data-testid={`country-${country.toLowerCase().replace(/\s+/g, '-')}`}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.target_country && (
                <p className="text-sm text-destructive">{errors.target_country}</p>
              )}
            </div>

            {/* Target Gender */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
                Target Gender
              </Label>
              <Select
                value={formData.target_gender}
                onValueChange={(value) => setFormData(prev => ({ ...prev, target_gender: value }))}
              >
                <SelectTrigger data-testid="gender-select">
                  <SelectValue placeholder="Select target gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Genders">All Genders</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Non-binary inclusive">Non-binary inclusive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Age Groups */}
            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
                Target Age Groups *
              </Label>
              <div className="flex flex-wrap gap-2" data-testid="age-groups-container">
                {AGE_GROUPS.map((age) => (
                  <Badge
                    key={age}
                    variant={formData.age_groups.includes(age) ? 'default' : 'outline'}
                    className={`cursor-pointer transition-all hover:scale-105 ${
                      formData.age_groups.includes(age) 
                        ? 'bg-foreground text-background' 
                        : 'hover:bg-secondary'
                    }`}
                    onClick={() => toggleAgeGroup(age)}
                    data-testid={`age-group-${age}`}
                  >
                    {age}
                    {formData.age_groups.includes(age) && (
                      <X className="w-3 h-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
              {errors.age_groups && (
                <p className="text-sm text-destructive">{errors.age_groups}</p>
              )}
            </div>

            {/* Brand Values */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="brand_values" className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
                Brand Values / Keywords (Optional)
              </Label>
              <Textarea
                id="brand_values"
                data-testid="brand-values-input"
                placeholder="e.g., eco-friendly, luxury, playful, innovative..."
                value={formData.brand_values}
                onChange={(e) => setFormData(prev => ({ ...prev, brand_values: e.target.value }))}
                rows={2}
              />
            </div>

            {/* Competitors */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="competitors" className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
                Industry Competitors (Optional)
              </Label>
              <Input
                id="competitors"
                data-testid="competitors-input"
                placeholder="e.g., Starbucks, Blue Bottle Coffee..."
                value={formData.competitors}
                onChange={(e) => setFormData(prev => ({ ...prev, competitors: e.target.value }))}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8">
            <Button
              type="submit"
              size="lg"
              disabled={isGenerating}
              className="w-full md:w-auto px-12 font-heading font-bold text-lg transition-all hover:-translate-y-0.5"
              data-testid="generate-button"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Palettes
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
