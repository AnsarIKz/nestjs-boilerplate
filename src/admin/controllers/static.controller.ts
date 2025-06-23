import { Controller, Get, Res, HttpStatus, Header } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import * as path from 'path';
import * as fs from 'fs';

@Controller('admin')
export class StaticController {
  @Get()
  @Get('/')
  @Header('Content-Type', 'text/html')
  async serveAdminPanel(@Res() res: FastifyReply) {
    const adminHtmlPath = path.join(process.cwd(), 'public', 'admin', 'index.html');

    if (fs.existsSync(adminHtmlPath)) {
      const fileContent = fs.readFileSync(adminHtmlPath, 'utf8');
      return res.type('text/html').send(fileContent);
    } else {
      return res.status(HttpStatus.NOT_FOUND).send('Admin panel not found');
    }
  }

  @Get('admin.js')
  @Header('Content-Type', 'application/javascript')
  async serveAdminJS(@Res() res: FastifyReply) {
    const adminJSPath = path.join(process.cwd(), 'public', 'admin', 'admin.js');

    if (fs.existsSync(adminJSPath)) {
      const fileContent = fs.readFileSync(adminJSPath, 'utf8');
      return res.type('application/javascript').send(fileContent);
    } else {
      return res.status(HttpStatus.NOT_FOUND).send('Admin JS not found');
    }
  }
}
