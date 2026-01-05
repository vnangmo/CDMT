import { Request, Response, NextFunction } from 'express';
import IndicatorService from '../services/indicator.service';

class IndicatorController {
  /**
   * Get all indicators
   */
  async getIndicators(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        objectiveId: req.query.objectiveId as string | undefined,
        indicatorType: req.query.indicatorType as string | undefined,
        frequency: req.query.frequency as string | undefined,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        search: req.query.search as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      };

      const result = await IndicatorService.getIndicators(filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get indicator by ID
   */
  async getIndicatorById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const indicator = await IndicatorService.getIndicatorById(id);
      res.json(indicator);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create indicator
   */
  async createIndicator(req: Request, res: Response, next: NextFunction) {
    try {
      const indicator = await IndicatorService.createIndicator(req.body);
      res.status(201).json(indicator);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update indicator
   */
  async updateIndicator(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const indicator = await IndicatorService.updateIndicator(id, req.body);
      res.json(indicator);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete indicator
   */
  async deleteIndicator(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await IndicatorService.deleteIndicator(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get indicators by Objective ID
   */
  async getIndicatorsByObjective(req: Request, res: Response, next: NextFunction) {
    try {
      const { objectiveId } = req.params;
      const indicators = await IndicatorService.getIndicatorsByObjective(objectiveId);
      res.json(indicators);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update actual values for an indicator
   */
  async updateActualValues(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const indicator = await IndicatorService.updateActualValues(id, req.body);
      res.json(indicator);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get indicator performance
   */
  async getIndicatorPerformance(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const performance = await IndicatorService.getIndicatorPerformance(id);
      res.json(performance);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get indicator statistics
   */
  async getIndicatorStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await IndicatorService.getIndicatorStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
}

export default new IndicatorController();
