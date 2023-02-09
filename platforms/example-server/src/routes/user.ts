import { Request, Response } from 'express';
import casual from 'casual';
import { get, post, request } from '../works/route';

type User = {
  id: number;
  name: string;
  username: string;
  age?: number;
};
const users: User[] = Array.from({ length: 15 }).map((d, i) => ({
  id: i,
  name: casual._name(),
  username: casual._username(),
  age: casual.integer(10, 40)
}));

@request('/api/user')
export default class UserRoute {
  @get('/list')
  fetchUsers(req: Request, res: Response) {
    const { query } = req;
    const { name, username, ids } = query as {
      name?: string;
      username?: string;
      ids?: string[];
    };
    const idSet = new Set<string>(ids || []);
    const result = users
      .filter(user => (name ? user.name.startsWith(name) : true))
      .filter(user => (username ? user.username.startsWith(username) : true))
      .filter(user => (ids ? idSet.has(user.id.toString()) : true));
    res.status(200).send(result);
  }

  @post('/')
  saveUser(req: Request, res: Response) {
    const { body } = req;
    const { username, name, age } = body;
    const id = users.length;
    users.push({ id, username, name, age });
    res.status(200).send(null);
  }

  @get('/')
  getUser(req: Request, res: Response) {
    const { query } = req;
    const { id } = query as { id?: number };
    if (id == null) {
      res.status(500).send({ message: `The id param is required.` });
    } else {
      const user = users.find(u => u.id === Number(id));
      if (user == null) {
        res.status(404).send(`The user with id ${id} is not exist.`);
      } else {
        res.status(200).send(user);
      }
    }
  }

  @get('/test')
  test(req: Request, res: Response) {
    res.send('test');
  }
}
