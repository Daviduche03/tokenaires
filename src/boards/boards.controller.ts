import { Controller, Get, Header, Query } from '@nestjs/common';
import { BoardResponse, GlobalStats } from '@tokenaires/contracts';
import { BOARD_CACHE_SECONDS } from '../config/constants';
import { BoardQueryDto } from './dto/board-query.dto';
import { BoardsService } from './boards.service';

const CACHE = `public, max-age=${BOARD_CACHE_SECONDS}, stale-while-revalidate=${BOARD_CACHE_SECONDS * 4}`;

@Controller()
export class BoardsController {
  constructor(private readonly boards: BoardsService) {}

  @Get('boards')
  @Header('Cache-Control', CACHE)
  board(@Query() query: BoardQueryDto): Promise<BoardResponse> {
    return this.boards.board(query);
  }

  @Get('stats')
  @Header('Cache-Control', CACHE)
  stats(): Promise<GlobalStats> {
    return this.boards.stats();
  }
}
