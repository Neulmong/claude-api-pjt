const express = require('express');
const { supabase } = require('../services/supabaseClient');

const router = express.Router();

function toRecipeResponse(row) {
  return {
    id: row.id,
    title: row.title,
    usedIngredients: row.used_ingredients,
    missingIngredients: row.missing_ingredients,
    estimatedCookTime: row.estimated_cook_time,
    steps: row.steps,
    createdAt: row.created_at,
  };
}

router.post('/', async (req, res) => {
  const { name, email } = req.body ?? {};

  if (typeof name !== 'string' || !name.trim() || typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({
      success: false,
      error: 'name과 email이 필요합니다.',
    });
  }

  const { data, error } = await supabase
    .from('users_tbl')
    .insert({ name: name.trim(), email: email.trim() })
    .select('id, name, email')
    .single();

  if (error) {
    if (error.code === '23505') {
      return res.status(409).json({ success: false, error: '이미 등록된 이메일입니다.' });
    }
    console.error('[users.create] Supabase error:', error.message);
    return res.status(502).json({ success: false, error: '사용자를 생성할 수 없습니다.' });
  }

  return res.status(201).json({ success: true, user: data });
});

router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('users_tbl')
    .select('id, name, email')
    .eq('id', req.params.id)
    .maybeSingle();

  if (error) {
    console.error('[users.get] Supabase error:', error.message);
    return res.status(502).json({ success: false, error: '사용자를 조회할 수 없습니다.' });
  }

  if (!data) {
    return res.status(404).json({ success: false, error: '사용자를 찾을 수 없습니다.' });
  }

  return res.json({ success: true, user: data });
});

router.post('/:id/recipes', async (req, res) => {
  const { title, usedIngredients, missingIngredients, estimatedCookTime, steps } = req.body ?? {};

  if (typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ success: false, error: 'title이 필요합니다.' });
  }

  const { data, error } = await supabase
    .from('recipes_tbl')
    .insert({
      user_id: req.params.id,
      title: title.trim(),
      used_ingredients: usedIngredients ?? [],
      missing_ingredients: missingIngredients ?? [],
      estimated_cook_time: estimatedCookTime ?? null,
      steps: steps ?? [],
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23503') {
      return res.status(404).json({ success: false, error: '사용자를 찾을 수 없습니다.' });
    }
    console.error('[users.saveRecipe] Supabase error:', error.message);
    return res.status(502).json({ success: false, error: '레시피를 저장할 수 없습니다.' });
  }

  return res.status(201).json({ success: true, recipe: toRecipeResponse(data) });
});

router.get('/:id/recipes', async (req, res) => {
  const { data, error } = await supabase
    .from('recipes_tbl')
    .select()
    .eq('user_id', req.params.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[users.listRecipes] Supabase error:', error.message);
    return res.status(502).json({ success: false, error: '저장된 레시피를 조회할 수 없습니다.' });
  }

  return res.json({ success: true, recipes: data.map(toRecipeResponse) });
});

router.delete('/:id/recipes/:recipeId', async (req, res) => {
  const { data, error } = await supabase
    .from('recipes_tbl')
    .delete()
    .eq('id', req.params.recipeId)
    .eq('user_id', req.params.id)
    .select('id');

  if (error) {
    console.error('[users.deleteRecipe] Supabase error:', error.message);
    return res.status(502).json({ success: false, error: '레시피를 삭제할 수 없습니다.' });
  }

  if (!data || data.length === 0) {
    return res.status(404).json({ success: false, error: '저장된 레시피를 찾을 수 없습니다.' });
  }

  return res.json({ success: true });
});

module.exports = router;
