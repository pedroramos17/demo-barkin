'use client';

import { useState, useEffect } from 'react';
import { TextField, Button, Box } from '@mui/material';
import styled from '@emotion/styled';
import RemoveIcon from '@mui/icons-material/Remove';
import ArrowBack from '@mui/icons-material/ArrowBack';
import { Formik, Form, FieldArray, FormikHelpers, getIn } from 'formik'
import * as Yup from 'yup'
import { initDB, addData, Stores, Driver, findOneData, updateData } from '@/lib/utils/db';
import dateParseBr from '@/lib/utils/date';
import Anchor from '@/lib/common/components/Link';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: stretch;
  width: 70%;
  height: 100%;
  padding: 24px auto;
  gap: 12px;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const FlexContainer = styled.div`
display: flex;
flex-direction: column;
@media (min-width: 640px) {
  flex-direction: row;
  gap: 48px;
  width: 100%;
}
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 600px) {
    grid-template-columns: repeat(1, 1fr);
  }
`;

interface UrlParams {
  id: string;
};

interface DriverFormValues {
  name: string;
  rg?: string;
  phone?: string;
  vehicles: {
    brand?: string;
    model?: string;
    year?: string;
    color?: string;
    plate?: string;
  }[];
}


export default function DriverForm(props: Readonly<UrlParams>) {
  const { id } = props;
  const [isDBReady, setIsDBReady] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [formDriverValue, setFormDriverValue] = useState<DriverFormValues>({
    name: '',
    rg: '',
    phone: '',
    vehicles: [
      {
        brand: '',
        model: '',
        year: '',
        color: '',
        plate: '',
      }
    ]
  })

  const timestamp = dateParseBr(new Date());
  const handleInitDB = async () => {
    const status = await initDB();
    setIsDBReady(status);
  };

  const handleAddDriver = async (values: DriverFormValues) => {
    const { name, rg, phone, vehicles } = values;
    const id = self.crypto.randomUUID();
    try {
      await addData(Stores.Drivers, { id, name, rg, phone, vehicles, createdAt: timestamp, updateAt: timestamp });
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(err.message);
        setError(err.message);
      } else {
        setError('Something went wrong');
      }
    }
  };

  const handleEditDriver = async (values: DriverFormValues) => {
    const { name, rg, phone, vehicles } = values;
    try {
      await updateData(Stores.Drivers, id, { name, rg, phone, vehicles, updateAt: timestamp });
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(err.message);
        setError(err.message);
      } else {
        setError('Something went wrong');
      }
    }
  }

  const handleFindOne = async () => {
    try {
      if (id) {
        return await findOneData<Driver>(Stores.Drivers, id);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(err.message);
        setError(err.message);
      } else {
        setError('Something went wrong');
      }
    }
  };

  const handleFillForm = async () => {
    if (!isDBReady) {
      await handleInitDB();
    }
    if (id) {
      const drivers = await handleFindOne()
      setFormDriverValue(drivers as unknown as DriverFormValues);
    }
  }
    
    useEffect(() => {
      handleFillForm();
    })
  const initialValues = {
      name: '',
      rg: '',
      phone: '',
      vehicles: [
        {
          brand: '',
          model: '',
          year: '',
          color: '',
          plate: '',
        }
      ]
  }

  const validationSchema = Yup.object().shape({
   name: Yup.string().min(2, 'Nome muito curto').trim().required('Nome é obrigatório'),
    rg: Yup.string().trim().nullable(),
    phone: Yup.string().trim().nullable(),
    vehicles: Yup.array().of(
      Yup.object().shape({
        brand: Yup.string().trim().nullable(),
        model: Yup.string().trim().nullable(),
        year: Yup.string().trim().nullable(),
        color: Yup.string().trim().nullable(),
        plate: Yup.string().trim().required('Placa é obrigatório'),
      }).nullable(),
    )
  })

  const handleSubmit = async (values: DriverFormValues, { setSubmitting }: FormikHelpers<DriverFormValues>) => {
    await handleInitDB();
    if (!isDBReady) {
      await handleInitDB();
    }
    if (id) {
      handleEditDriver(values);
    } else {
      handleAddDriver(values);
    }
    setSubmitting(false);
    window.location.replace('/motoristas');
  }

  return (
      <Box sx={{ mx: 4 }}>
        <Anchor href="/motoristas">
          <ArrowBack sx={{ fontSize: 36, color: '#000' }} />
        </Anchor>
        <h1>{id ? "Editar" : "Cadastrar"} Motorista</h1>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <Formik
          initialValues={formDriverValue || initialValues}
          validationSchema={validationSchema}
          validateOnChange
          validateOnBlur
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ values, touched, errors, handleChange, handleBlur, isValid } ) => {
            const touchedName = getIn(touched, 'name');
            const errorName = getIn(errors, 'name');
            const touchedRg = getIn(touched, 'rg');
            const errorRg = getIn(errors, 'rg');
            const touchedPhone = getIn(touched, 'phone');
            const errorPhone = getIn(errors, 'phone');
            return (
            <Form noValidate>
              <Container>
                <TextField 
                  label="Nome"
                  variant="standard"
                  name="name"
                  value={values.name}
                  helperText={ touchedName && errorName ? errorName : ""}
                  error={Boolean(touchedName && errorName)}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  autoFocus
                />
                <FlexContainer>
                  <TextField
                    label="RG"
                    variant="standard"
                    name="rg"
                    value={values.rg}
                    helperText={ touchedRg && errorRg ? errorRg : ""}
                    error={Boolean(touchedRg && errorRg)}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  <TextField
                    label="Telefone"
                    variant="standard"
                    name="phone"
                    value={values.phone}
                    helperText={ touchedPhone && errorPhone ? errorPhone : ""}
                    error={Boolean(touchedPhone && errorPhone)}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </FlexContainer>
                <h2>Adicionar Veículo</h2>
                <FieldArray name='vehicles'>
                  {({ remove, push }) => (
                    <div>
                      {values.vehicles?.length > 0 &&
                        values.vehicles.map((_, index) => {
                          const vehicleId = `vehicles[${index}].vehicleId`;
                          const brand = `vehicles[${index}].brand`;
                          const model = `vehicles[${index}].model`;
                          const year = `vehicles[${index}].year`;
                          const color = `vehicles[${index}].color`;
                          const plate = `vehicles[${index}].plate`;

                          const touchedBrand = getIn(touched, brand);
                          const errorBrand = getIn(errors, brand);

                          const touchedModel = getIn(touched, model);
                          const errorModel = getIn(errors, model);

                          const touchedYear = getIn(touched, year);
                          const errorYear = getIn(errors, year);

                          const touchedColor = getIn(touched, color);
                          const errorColor = getIn(errors, color);

                          const touchedPlate = getIn(touched, plate);
                          const errorPlate = getIn(errors, plate);

                          return (
                          <div key={vehicleId} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <Box sx={{ mt: 4 }}>
                              <Button
                                variant="outlined"
                                color="error"
                                onClick={() => remove(index)}
                              ><RemoveIcon /></Button>
                            </Box>
                            <GridContainer>
                            <TextField
                              label="Marca"
                              variant="standard"
                              name={brand}
                              value={values?.vehicles[index]?.brand}
                              helperText={ touchedBrand && errorBrand ? errorBrand : ""}
                              error={Boolean(touchedBrand && errorBrand)}
                              onChange={handleChange}
                              onBlur={handleBlur}
                            />
                            <TextField
                              label="Modelo"
                              variant="standard"
                              name={model}
                              value={values.vehicles[index]?.model}
                              helperText={ touchedModel && errorModel ? errorModel : ""}
                              error={Boolean(touchedModel && errorModel)}
                              onChange={handleChange}
                              onBlur={handleBlur}
                            />
                            <TextField
                              label="Ano"
                              variant="standard"
                              name={year}
                              value={values.vehicles[index]?.year}
                              helperText={ touchedYear && errorYear ? errorYear : ""}
                              error={Boolean(touchedYear && errorYear)}
                              onChange={handleChange}
                              onBlur={handleBlur}
                            />
                            <TextField
                              label="Cor"
                              variant="standard"
                              name={color}
                              value={values.vehicles[index]?.color}
                              helperText={ touchedColor && errorColor ? errorColor : ""}
                              error={Boolean(touchedColor && errorColor)}
                              onChange={handleChange}
                              onBlur={handleBlur}
                            />
                            <TextField
                              label="Placa"
                              variant="standard"
                              name={plate}
                              value={values.vehicles[index]?.plate}
                              helperText={ touchedPlate && errorPlate ? errorPlate : ""}
                              error={Boolean(touchedPlate && errorPlate)}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              required
                            />
                            </GridContainer>
                          </div>
                        )})}
                          <Box sx={{ my: 4 }}>
                          <Button variant="contained" color="info" onClick={() => push({ brand: '', model: '', year: '', color: '', plate: '' })}>
                            +1 Veículo
                          </Button>
                        </Box>
                      </div>
                  )}
                </FieldArray>
                {!isValid && (
                  <span>Todos os campos precisam ser preenchidos corretamente</span>
                )}
                <ButtonContainer>
                  <Button type="submit" variant="contained" >Salvar</Button>
                </ButtonContainer>
              </Container>
            </Form>
          )}}
        </Formik>
      </Box>
  );
}
