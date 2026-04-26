import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storeRouter from "./store";
import productsRouter from "./products";
import collectionsRouter from "./collections";
import cartRouter from "./cart";
import ordersRouter from "./orders";
import customersRouter from "./customers";
import discountsRouter from "./discounts";
import reviewsRouter from "./reviews";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storeRouter);
router.use(productsRouter);
router.use(collectionsRouter);
router.use(cartRouter);
router.use(ordersRouter);
router.use(customersRouter);
router.use(discountsRouter);
router.use(reviewsRouter);
router.use(adminRouter);

export default router;
