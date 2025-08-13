-- Fix comment count trigger to work for all users
-- The issue is that the trigger needs to update visualizations that the commenting user doesn't own
-- We use SECURITY DEFINER to run the trigger with elevated privileges

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS trigger_update_comments_count ON public.comments;
DROP FUNCTION IF EXISTS public.update_comments_count();

-- Recreate the function with SECURITY DEFINER so it runs with elevated privileges
CREATE OR REPLACE FUNCTION public.update_comments_count()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.visualizations 
    SET comments_count = COALESCE(comments_count, 0) + 1 
    WHERE id = NEW.visualization_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.visualizations 
    SET comments_count = GREATEST(0, COALESCE(comments_count, 0) - 1) 
    WHERE id = OLD.visualization_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER trigger_update_comments_count
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_comments_count();

-- Also fix the likes and saves count triggers while we're at it
DROP TRIGGER IF EXISTS trigger_update_likes_count ON public.likes;
DROP FUNCTION IF EXISTS public.update_likes_count();

CREATE OR REPLACE FUNCTION public.update_likes_count()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.visualizations 
    SET likes_count = COALESCE(likes_count, 0) + 1 
    WHERE id = NEW.visualization_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.visualizations 
    SET likes_count = GREATEST(0, COALESCE(likes_count, 0) - 1) 
    WHERE id = OLD.visualization_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_likes_count
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.update_likes_count();

-- Fix saves count trigger
DROP TRIGGER IF EXISTS trigger_update_saves_count ON public.saves;
DROP FUNCTION IF EXISTS public.update_saves_count();

CREATE OR REPLACE FUNCTION public.update_saves_count()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.visualizations 
    SET saves_count = COALESCE(saves_count, 0) + 1 
    WHERE id = NEW.visualization_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.visualizations 
    SET saves_count = GREATEST(0, COALESCE(saves_count, 0) - 1) 
    WHERE id = OLD.visualization_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_saves_count
  AFTER INSERT OR DELETE ON public.saves
  FOR EACH ROW EXECUTE FUNCTION public.update_saves_count();

-- Let's also verify and fix any existing count mismatches
-- Update comments_count to match actual count
UPDATE public.visualizations v
SET comments_count = (
  SELECT COUNT(*) 
  FROM public.comments c 
  WHERE c.visualization_id = v.id
)
WHERE v.comments_count != (
  SELECT COUNT(*) 
  FROM public.comments c 
  WHERE c.visualization_id = v.id
);

-- Update likes_count to match actual count
UPDATE public.visualizations v
SET likes_count = (
  SELECT COUNT(*) 
  FROM public.likes l 
  WHERE l.visualization_id = v.id
)
WHERE v.likes_count != (
  SELECT COUNT(*) 
  FROM public.likes l 
  WHERE l.visualization_id = v.id
);

-- Update saves_count to match actual count
UPDATE public.visualizations v
SET saves_count = (
  SELECT COUNT(*) 
  FROM public.saves s 
  WHERE s.visualization_id = v.id
)
WHERE v.saves_count != (
  SELECT COUNT(*) 
  FROM public.saves s 
  WHERE s.visualization_id = v.id
);