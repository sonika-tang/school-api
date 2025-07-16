import db from '../models/index.js';

/**
 * @swagger
 * tags:
 *   name: Students
 *   description: Student management
 */

/**
 * @swagger
 * /students:
 *   post:
 *     summary: Create a new student
 *     security:
 *         - bearerAuth: []
 *     tags: [Students]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Student'
 *     responses:
 *       201:
 *         description: Student created
 */

export const createStudent = async (req, res) => {
    try {
        const student = await db.Student.create(req.body);
        res.status(201).json(student);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * @swagger
 * /students:
 *   get:
 *     summary: Get all students
 *     security:
 *         - bearerAuth: []
 *     tags: [Students]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *         description: Items per page
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *         description: Sort order by creation time
 *       - in: query
 *         name: include
 *         schema: { type: string }
 *         description: |
 *           Comma-separated relations to populate
 *     responses:
 *       200:
 *         description: List of students with requested relations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 meta:
 *                   type: object
 *                   properties:
 *                     totalItems:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *                     itemsPerPage:
 *                       type: integer
 *                     sortOrder:
 *                       type: string
 *                 data:
 *                   type: array
 */
export const getAllStudents = async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const sortOrder = req.query.sort === 'asc' ? 'ASC' : 'DESC';
    const includeParam = req.query.include || '';
    
    const include = [];
    const validRelations = {
        Courses: {
            model: db.Course,
            attributes: ['id', 'title', 'description'],
            through: { attributes: [] }
        },
        Teacher: {
            model: db.Teacher,
            attributes: ['id', 'name', 'email']
        }
    };

    includeParam.split(',').forEach(relation => {
        const trimmedRelation = relation.trim();
        if (validRelations[trimmedRelation]) {
            include.push(validRelations[trimmedRelation]);
        }
    });

    try {
        const { count, rows } = await db.Student.findAndCountAll({
            include: include.length ? include : undefined,
            limit: limit,
            offset: (page - 1) * limit,
            order: [['createdAt', sortOrder]],
            distinct: true
        });

        res.json({
            meta: {
                totalItems: count,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                itemsPerPage: limit,
                sortOrder: sortOrder,
                includedRelations: includeParam || 'none'
            },
            data: rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * @swagger
 * /students/{id}:
 *   get:
 *     summary: Get a student by ID
 *     security:
 *         - bearerAuth: []
 *     tags: [Students]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: A student
 *       404:
 *         description: Not found
 */
export const getStudentById = async (req, res) => {
    try {
        const student = await db.Student.findByPk(req.params.id, { include: db.Course });
        if (!student) return res.status(404).json({ message: 'Not found' });
        res.json(student);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * @swagger
 * /students/{id}:
 *   put:
 *     summary: Update a student
 *     security:
 *         - bearerAuth: []
 *     tags: [Students]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200:
 *         description: Updated
 */
export const updateStudent = async (req, res) => {
    try {
        const student = await db.Student.findByPk(req.params.id);
        if (!student) return res.status(404).json({ message: 'Not found' });
        await student.update(req.body);
        res.json(student);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * @swagger
 * /students/{id}:
 *   delete:
 *     summary: Delete a student
 *     security:
 *         - bearerAuth: []
 *     tags: [Students]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Deleted
 */
export const deleteStudent = async (req, res) => {
    try {
        const student = await db.Student.findByPk(req.params.id);
        if (!student) return res.status(404).json({ message: 'Not found' });
        await student.destroy();
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
