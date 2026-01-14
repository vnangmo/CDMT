import { Request, Response } from 'express';
import fiscalMarginService from '../services/fiscalMargin.service';

// =============================================
// RESERVE RATES
// =============================================

export const getReserveRates = async (req: Request, res: Response) => {
  try {
    const { macroFrameworkId } = req.params;
    const rates = await fiscalMarginService.getReserveRates(macroFrameworkId);
    res.json(rates);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createReserveRate = async (req: Request, res: Response) => {
  try {
    const rate = await fiscalMarginService.createReserveRate(req.body);
    res.status(201).json(rate);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateReserveRate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rate = await fiscalMarginService.updateReserveRate(id, req.body);
    res.json(rate);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteReserveRate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await fiscalMarginService.deleteReserveRate(id);
    res.json({ message: 'Reserve rate deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const upsertReserveRates = async (req: Request, res: Response) => {
  try {
    const { macroFrameworkId } = req.params;
    const { rates } = req.body;
    const result = await fiscalMarginService.upsertReserveRates(macroFrameworkId, rates);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// =============================================
// AVAILABLE FISCAL MARGINS
// =============================================

export const getAvailableFiscalMargins = async (req: Request, res: Response) => {
  try {
    const { macroFrameworkId } = req.params;
    const margins = await fiscalMarginService.getAvailableFiscalMargins(macroFrameworkId);
    res.json(margins);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createAvailableFiscalMargin = async (req: Request, res: Response) => {
  try {
    const margin = await fiscalMarginService.createAvailableFiscalMargin(req.body);
    res.status(201).json(margin);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateAvailableFiscalMargin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const margin = await fiscalMarginService.updateAvailableFiscalMargin(id, req.body);
    res.json(margin);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteAvailableFiscalMargin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await fiscalMarginService.deleteAvailableFiscalMargin(id);
    res.json({ message: 'Fiscal margin deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const calculateAvailableFiscalMargins = async (req: Request, res: Response) => {
  try {
    const { macroFrameworkId } = req.params;
    const margins = await fiscalMarginService.calculateAvailableFiscalMargins(macroFrameworkId);
    res.json(margins);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// =============================================
// NEW MEASURE RATES
// =============================================

export const getNewMeasureRates = async (req: Request, res: Response) => {
  try {
    const { macroFrameworkId } = req.params;
    const rates = await fiscalMarginService.getNewMeasureRates(macroFrameworkId);
    res.json(rates);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createNewMeasureRate = async (req: Request, res: Response) => {
  try {
    const rate = await fiscalMarginService.createNewMeasureRate(req.body);
    res.status(201).json(rate);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateNewMeasureRate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rate = await fiscalMarginService.updateNewMeasureRate(id, req.body);
    res.json(rate);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteNewMeasureRate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await fiscalMarginService.deleteNewMeasureRate(id);
    res.json({ message: 'New measure rate deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const upsertNewMeasureRates = async (req: Request, res: Response) => {
  try {
    const { macroFrameworkId } = req.params;
    const { rates } = req.body;
    const result = await fiscalMarginService.upsertNewMeasureRates(macroFrameworkId, rates);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// =============================================
// NEW MEASURES
// =============================================

export const getNewMeasures = async (req: Request, res: Response) => {
  try {
    const { macroFrameworkId } = req.params;
    const measures = await fiscalMarginService.getNewMeasures(macroFrameworkId);
    res.json(measures);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createNewMeasure = async (req: Request, res: Response) => {
  try {
    const measure = await fiscalMarginService.createNewMeasure(req.body);
    res.status(201).json(measure);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateNewMeasure = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const measure = await fiscalMarginService.updateNewMeasure(id, req.body);
    res.json(measure);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteNewMeasure = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await fiscalMarginService.deleteNewMeasure(id);
    res.json({ message: 'New measure deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// =============================================
// DISTRIBUTION KEYS
// =============================================

export const getDistributionKeys = async (req: Request, res: Response) => {
  try {
    const { macroFrameworkId } = req.params;
    const keys = await fiscalMarginService.getDistributionKeys(macroFrameworkId);
    res.json(keys);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createDistributionKey = async (req: Request, res: Response) => {
  try {
    const key = await fiscalMarginService.createDistributionKey(req.body);
    res.status(201).json(key);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateDistributionKey = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const key = await fiscalMarginService.updateDistributionKey(id, req.body);
    res.json(key);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteDistributionKey = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await fiscalMarginService.deleteDistributionKey(id);
    res.json({ message: 'Distribution key deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const upsertDistributionKeys = async (req: Request, res: Response) => {
  try {
    const { macroFrameworkId } = req.params;
    const { keys } = req.body;
    const result = await fiscalMarginService.upsertDistributionKeys(macroFrameworkId, keys);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// =============================================
// MINISTRY MARGINS
// =============================================

export const getMinistryMargins = async (req: Request, res: Response) => {
  try {
    const { macroFrameworkId } = req.params;
    const margins = await fiscalMarginService.getMinistryMargins(macroFrameworkId);
    res.json(margins);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getMinistryMarginsByMinistry = async (req: Request, res: Response) => {
  try {
    const { macroFrameworkId, ministryId } = req.params;
    const margins = await fiscalMarginService.getMinistryMarginsByMinistry(macroFrameworkId, ministryId);
    res.json(margins);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createMinistryMargin = async (req: Request, res: Response) => {
  try {
    const margin = await fiscalMarginService.createMinistryMargin(req.body);
    res.status(201).json(margin);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateMinistryMargin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const margin = await fiscalMarginService.updateMinistryMargin(id, req.body);
    res.json(margin);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteMinistryMargin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await fiscalMarginService.deleteMinistryMargin(id);
    res.json({ message: 'Ministry margin deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const calculateMinistryMargins = async (req: Request, res: Response) => {
  try {
    const { macroFrameworkId } = req.params;
    const margins = await fiscalMarginService.calculateMinistryMargins(macroFrameworkId);
    res.json(margins);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// =============================================
// SUMMARY
// =============================================

export const getFiscalMarginSummary = async (req: Request, res: Response) => {
  try {
    const { macroFrameworkId } = req.params;
    const summary = await fiscalMarginService.getFiscalMarginSummary(macroFrameworkId);
    res.json(summary);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export default {
  // Reserve Rates
  getReserveRates,
  createReserveRate,
  updateReserveRate,
  deleteReserveRate,
  upsertReserveRates,
  // Available Fiscal Margins
  getAvailableFiscalMargins,
  createAvailableFiscalMargin,
  updateAvailableFiscalMargin,
  deleteAvailableFiscalMargin,
  calculateAvailableFiscalMargins,
  // New Measure Rates
  getNewMeasureRates,
  createNewMeasureRate,
  updateNewMeasureRate,
  deleteNewMeasureRate,
  upsertNewMeasureRates,
  // New Measures
  getNewMeasures,
  createNewMeasure,
  updateNewMeasure,
  deleteNewMeasure,
  // Distribution Keys
  getDistributionKeys,
  createDistributionKey,
  updateDistributionKey,
  deleteDistributionKey,
  upsertDistributionKeys,
  // Ministry Margins
  getMinistryMargins,
  getMinistryMarginsByMinistry,
  createMinistryMargin,
  updateMinistryMargin,
  deleteMinistryMargin,
  calculateMinistryMargins,
  // Summary
  getFiscalMarginSummary,
};
